// PUBLIC SPY WEBSITE SCRIPT

// Gets the mobile menu button and navigation.
const menuButton = document.getElementById("menuButton");
const siteNav = document.getElementById("siteNav");

// Opens and closes the mobile navigation menu.
menuButton.addEventListener("click", () => {
  siteNav.classList.toggle("open");
});

// Closes the mobile navigation after someone taps a link.
siteNav.querySelectorAll("a").forEach(link => {
  link.addEventListener("click", () => {
    siteNav.classList.remove("open");
  });
});
