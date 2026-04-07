const input = document.getElementById("apiKey");
const status = document.getElementById("status");

// Load saved key
chrome.storage.sync.get("apiKey", ({ apiKey }) => {
  if (apiKey) input.value = apiKey;
});

// Toggle visibility
document.getElementById("toggleShow").addEventListener("click", () => {
  input.type = input.type === "password" ? "text" : "password";
});

// Save
document.getElementById("save").addEventListener("click", () => {
  const key = input.value.trim();
  if (!key) {
    status.textContent = "Please enter an API key.";
    status.style.color = "#c0392b";
    return;
  }
  chrome.storage.sync.set({ apiKey: key }, () => {
    status.textContent = "Saved!";
    status.style.color = "#2e7d32";
    setTimeout(() => (status.textContent = ""), 2000);
  });
});
