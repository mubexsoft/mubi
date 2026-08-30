"use strict";

const API_URL = "https://mubexsoft.github.io/mobile_api/other_mubi_apps.json";

const appStage = document.getElementById("appStage");
const loadingSpinner = document.getElementById("loadingSpinner");
const appIcon = document.getElementById("appIcon");
const sorryPage = document.getElementById("sorryPage");
const sorryMessage = document.getElementById("sorryMessage");
const storeModal = document.getElementById("storeModal");
const modalAppName = document.getElementById("modalAppName");
const modalAppIcon = document.getElementById("modalAppIcon");
const appleStoreButton = document.getElementById("appleStoreButton");
const googleStoreButton = document.getElementById("googleStoreButton");
const closeModalButton = document.getElementById("closeModalButton");

function getRequestedAppId(){
  const rawId = new URLSearchParams(window.location.search).get("id");
  return typeof rawId === "string" ? rawId.trim().toLowerCase() : "";
}

function hasValidUrl(url){
  if(typeof url !== "string" || url.trim() === "" || url.trim() === "#") return false;
  try{
    const parsedUrl = new URL(url,window.location.href);
    return parsedUrl.protocol === "https:" || parsedUrl.protocol === "http:";
  }catch{
    return false;
  }
}

function getDeviceType(){
  const userAgent = navigator.userAgent || "";
  const isIPadOS = navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
  if(/android/i.test(userAgent)) return "android";
  if(/iPad|iPhone|iPod/i.test(userAgent) || isIPadOS) return "ios";
  return "desktop";
}

function getApps(data){
  if(Array.isArray(data?.other_mubi_apps)) return data.other_mubi_apps;
  if(Array.isArray(data?.other_eng_apps)) return data.other_eng_apps;
  if(Array.isArray(data?.apps)) return data.apps;
  if(Array.isArray(data)) return data;
  return [];
}

function updatePageMetadata(app){
  document.title = `${app.app_name} İndir`;
  const description = document.querySelector('meta[name="description"]');
  if(description) description.content = app.app_description || `${app.app_name} uygulamasını indir`;
}

function showAppIcon(app){
  return new Promise(resolve => {
    let completed = false;
    const finish = () => {
      if(completed) return;
      completed = true;
      loadingSpinner.classList.add("hidden");
      appIcon.classList.add("visible");
      resolve();
    };

    appIcon.src = app.icon_path;
    appIcon.alt = app.app_name;

    if(appIcon.complete){
      finish();
      return;
    }

    appIcon.addEventListener("load",finish,{once:true});
    appIcon.addEventListener("error",finish,{once:true});
    window.setTimeout(finish,1800);
  });
}

function showSorry(message){
  loadingSpinner.classList.add("hidden");
  appStage.style.display = "none";
  storeModal.classList.remove("active");
  if(message) sorryMessage.textContent = message;
  sorryPage.classList.add("active");
  document.title = "Üzgünüz | MUBİ";
}

function showDesktopStorePopup(app){
  modalAppName.textContent = app.app_name;
  modalAppIcon.src = app.icon_path;
  modalAppIcon.alt = app.app_name;

  const hasAppleStore = hasValidUrl(app.app_store_url);
  const hasGooglePlay = hasValidUrl(app.google_play_url);

  appleStoreButton.style.display = hasAppleStore ? "block" : "none";
  googleStoreButton.style.display = hasGooglePlay ? "block" : "none";

  if(hasAppleStore) appleStoreButton.href = app.app_store_url;
  if(hasGooglePlay) googleStoreButton.href = app.google_play_url;

  if(!hasAppleStore && !hasGooglePlay){
    showSorry("Bu uygulama için kullanılabilir bir mağaza bağlantısı bulunamadı.");
    return;
  }

  storeModal.classList.add("active");
}

function openAppStore(app){
  const device = getDeviceType();

  if(device === "ios"){
    if(hasValidUrl(app.app_store_url)){
      window.location.replace(app.app_store_url);
      return;
    }
    showSorry("Bu uygulamanın App Store bağlantısı şu anda kullanılamıyor.");
    return;
  }

  if(device === "android"){
    if(hasValidUrl(app.google_play_url)){
      window.location.replace(app.google_play_url);
      return;
    }
    showSorry("Bu uygulamanın Google Play bağlantısı şu anda kullanılamıyor.");
    return;
  }

  showDesktopStorePopup(app);
}

function closeStoreModal(){
  storeModal.classList.remove("active");
}

closeModalButton.addEventListener("click",closeStoreModal);
storeModal.addEventListener("click",event => {
  if(event.target === storeModal) closeStoreModal();
});
document.addEventListener("keydown",event => {
  if(event.key === "Escape" && storeModal.classList.contains("active")) closeStoreModal();
});

async function loadApp(){
  const requestedAppId = getRequestedAppId();

  if(!requestedAppId){
    showSorry("İndirmek istediğiniz uygulamanın kimliği belirtilmedi.");
    return;
  }

  try{
    const response = await fetch(API_URL,{cache:"no-store"});
    if(!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    const apps = getApps(data);

    if(!apps.length) throw new Error("Geçersiz API yanıtı");

    const app = apps.find(item => {
      const itemId = typeof item.app_id === "string" ? item.app_id.trim().toLowerCase() : "";
      return itemId === requestedAppId && item.is_active !== false;
    });

    if(!app){
      showSorry(`"${requestedAppId}" kimliğine ait aktif bir uygulama bulunamadı.`);
      return;
    }

    if(typeof app.icon_path !== "string" || app.icon_path.trim() === ""){
      showSorry("Uygulama bilgileri eksik olduğu için indirme sayfası açılamadı.");
      return;
    }

    updatePageMetadata(app);
    await showAppIcon(app);
    openAppStore(app);
  }catch(error){
    console.error("Uygulama bilgisi yüklenemedi:",error);
    showSorry("Uygulama bilgilerine şu anda ulaşılamıyor. Lütfen daha sonra yeniden deneyin.");
  }
}

loadApp();
