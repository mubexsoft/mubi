"use strict";

const API_URL = "https://mubexsoft.github.io/mobile_api/mubi_website_api.json";


const appGrid = document.getElementById("appGrid");
const storeModal = document.getElementById("storeModal");
const modalAppName = document.getElementById("modalAppName");
const modalAppIcon = document.getElementById("modalAppIcon");
const appleStoreButton = document.getElementById("appleStoreButton");
const googleStoreButton = document.getElementById("googleStoreButton");
const closeModal = document.getElementById("closeModal");

function hasValidUrl(url){
  return typeof url === "string" && url.trim() !== "" && url.trim() !== "#";
}

function getDeviceType(){
  const ua = navigator.userAgent || "";
  const isIPadOS = navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
  if(/android/i.test(ua)) return "android";
  if(/iPad|iPhone|iPod/i.test(ua) || isIPadOS) return "ios";
  return "desktop";
}

function openApp(app){
  const device = getDeviceType();

  if(device === "ios" && hasValidUrl(app.app_store_url)){
    window.location.assign(app.app_store_url);
    return;
  }

  if(device === "android" && hasValidUrl(app.google_play_url)){
    window.location.assign(app.google_play_url);
    return;
  }

  modalAppName.textContent = app.app_name || "MUBİ";
  modalAppIcon.src = app.icon_path || "";
  modalAppIcon.alt = app.app_name || "MUBİ";

  const hasApple = hasValidUrl(app.app_store_url);
  const hasGoogle = hasValidUrl(app.google_play_url);

  appleStoreButton.style.display = hasApple ? "block" : "none";
  googleStoreButton.style.display = hasGoogle ? "block" : "none";

  if(hasApple) appleStoreButton.href = app.app_store_url;
  if(hasGoogle) googleStoreButton.href = app.google_play_url;

  storeModal.classList.add("active");
  document.body.style.overflow = "hidden";
}

function closeStoreModal(){
  storeModal.classList.remove("active");
  document.body.style.overflow = "";
}

function createAppCard(app){
  const card = document.createElement("button");
  card.type = "button";
  card.className = "app-card";
  card.setAttribute("aria-label", app.app_name || "MUBİ uygulaması");

  const icon = document.createElement("img");
  icon.className = "app-icon";
  icon.src = app.icon_path || "";
  icon.alt = app.app_name || "MUBİ";
  icon.loading = "lazy";
  icon.decoding = "async";

  const name = document.createElement("div");
  name.className = "app-name";
  name.textContent = app.app_name || "MUBİ";

  const link = document.createElement("div");
  link.className = "app-link";
  link.textContent = "Uygulamayı Gör →";

  card.append(icon,name,link);
  card.addEventListener("click",() => {
    if(typeof app.app_id === "string" && app.app_id.trim() !== ""){
      window.location.href = `store.html?id=${encodeURIComponent(app.app_id.trim())}`;
      return;
    }
    openApp(app);
  });
  return card;
}

function getApps(data){
  if(Array.isArray(data?.other_mubi_apps)) return data.other_mubi_apps;
  if(Array.isArray(data?.other_eng_apps)) return data.other_eng_apps;
  if(Array.isArray(data?.apps)) return data.apps;
  if(Array.isArray(data)) return data;
  return [];
}

function isMubiBundle(app){
  const bundle = [
    app.bundle_id,
    app.bundleId,
    app.bundle,
    app.package_name,
    app.packageName,
    app.ios_bundle_id,
    app.android_package,
    app.flavor
  ].filter(Boolean).join(" ").toLowerCase();

  return bundle === "" || bundle.includes("mubi");
}

async function loadApps(){
  appGrid.innerHTML = `<div class="loading"><div class="spinner"></div>Uygulamalar yükleniyor...</div>`;

  try{
    const response = await fetch(API_URL,{cache:"no-store"});
    if(!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();

    const apps = getApps(data)
      .filter(app => app?.is_active !== false)
      .filter(isMubiBundle)
      .sort((a,b) => (Number(a.order) || 0) - (Number(b.order) || 0));

    if(!apps.length){
      appGrid.innerHTML = `<div class="empty">Gösterilecek MUBİ uygulaması bulunamadı.</div>`;
      return;
    }

    appGrid.innerHTML = "";
    apps.forEach(app => appGrid.appendChild(createAppCard(app)));
  }catch(error){
    console.error("MUBİ uygulamaları yüklenemedi:",error);
    appGrid.innerHTML = `<div class="error">Uygulamalar şu anda yüklenemedi.<button class="retry" type="button" onclick="loadApps()">Tekrar Dene</button></div>`;
  }
}

closeModal.addEventListener("click",closeStoreModal);
storeModal.addEventListener("click",event => { if(event.target === storeModal) closeStoreModal(); });
document.addEventListener("keydown",event => {
  if(event.key === "Escape" && storeModal.classList.contains("active")) closeStoreModal();
});

loadApps();
