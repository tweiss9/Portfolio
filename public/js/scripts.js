let recaptchaSiteKey;
let recaptchaLoading = false;
let recaptchaComplete = false;
const prefix = "https://us-central1-tylerhweiss.cloudfunctions.net/api";

document.addEventListener("DOMContentLoaded", function () {
  setupNavigation();
  setupHomeLink();
  setupSubmitButton();
  fetchSiteKey();
});

function setupNavigation() {
  const navigationLinks = document.querySelectorAll(".nav-link");
  navigationLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      const sectionId = link.getAttribute("href");
      scrollToSection(sectionId);
    });
  });
}

function setupHomeLink() {
  const homeLink = document.getElementById("home-link");
  if (homeLink) {
    homeLink.addEventListener("click", (event) => {
      event.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  } else {
    console.error("Could not find home-link element");
  }
}

function setupSubmitButton() {
  const submitButton = document.getElementById("submitButton");
  if (submitButton) {
    submitButton.addEventListener("click", handleSubmit);
  } else {
    console.error("Could not find submitButton element");
  }
}

function fetchSiteKey() {
  fetch(prefix + "/get-site-key")
    .then((response) => response.json())
    .then((data) => {
      recaptchaSiteKey = data.recaptchaSiteKey;
      setupRecaptcha();
    })
    .catch((error) => {
      console.error("Error fetching reCAPTCHA site key:", error);
    });
}

function setupRecaptcha() {
  const recaptchaDiv = document.getElementById("recaptchaDiv");
  if (recaptchaDiv) {
    recaptchaDiv.setAttribute("data-sitekey", recaptchaSiteKey);

    if (window.grecaptcha) {
      grecaptcha.ready(function () {
        grecaptcha.render("recaptchaDiv", {
          sitekey: recaptchaSiteKey,
          callback: checkRecaptchaStatus,
          "error-callback": function (error) {
            console.error("Error during reCAPTCHA verification.", error);
          },
        });
      });
    } else {
      console.error("grecaptcha is not defined.");
    }
  } else {
    console.error("Could not find recaptchaDiv element");
  }
}

async function fetchCsrfToken() {
  try {
    const response = await fetch(prefix + "/get-csrf-token", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    const data = await response.json();
    const csrfToken = data.csrfToken;
    document.cookie = `XSRF-TOKEN=${csrfToken}; Path=/; Secure; SameSite=None`;

    return csrfToken;
  } catch (error) {
    console.error("Error fetching CSRF token:", error);
    return null;
  }
}

function checkRecaptchaStatus() {
  recaptchaLoading = true;
  const recaptchaResponse = grecaptcha.getResponse();

  fetch(prefix + "/reCAPTCHA", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      "g-recaptcha-response": recaptchaResponse,
    }),
  })
    .then((response) => response.json())
    .then((verificationResult) => {
      recaptchaLoading = false;
      recaptchaComplete = verificationResult.success;
      if (!recaptchaComplete) {
        console.error(
          "reCAPTCHA verification failed:",
          verificationResult.error || "Unknown error"
        );
      }
    })
    .catch((error) => {
      recaptchaComplete = false;
      recaptchaLoading = false;
      console.error("Error verifying reCAPTCHA:", error);
    });
}

async function handleSubmit(event) {
  event.preventDefault();

  while (recaptchaLoading) {
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  const formData = collectFormData();
  if (!validateForm(formData)) return;

  showLoadingSpinner();
  sendEmail(formData);
}

function collectFormData() {
  const nameInput = document.getElementById("name");
  const emailInput = document.getElementById("email");
  const messageInput = document.getElementById("message");

  return {
    name: nameInput.value.trim(),
    email: emailInput.value.trim(),
    message: messageInput.value.trim(),
  };
}

function validateForm(formData) {
  let isValid = true;

  isValid =
    toggleValidation(
      document.getElementById("name"),
      !formData.name,
      "nameError"
    ) && isValid;
  isValid =
    toggleValidation(
      document.getElementById("email"),
      !formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email),
      "emailError"
    ) && isValid;
  isValid =
    toggleValidation(
      document.getElementById("message"),
      !formData.message,
      "messageError"
    ) && isValid;
  isValid =
    toggleValidation(
      document.querySelector(".g-recaptcha"),
      !recaptchaComplete,
      "recaptchaError"
    ) && isValid;

  return isValid;
}

function toggleValidation(inputField, condition, errorFieldId) {
  const errorField = document.getElementById(errorFieldId);
  if (condition) {
    inputField.classList.add("is-invalid");
    if (errorField) errorField.style.display = "block";
    return false;
  } else {
    inputField.classList.remove("is-invalid");
    if (errorField) errorField.style.display = "none";
    return true;
  }
}

function showLoadingSpinner() {
  const loadingMessage = document.getElementById("loadingMessage");
  if (loadingMessage) {
    loadingMessage.classList.remove("d-none");
  }
}

function hideLoadingSpinner() {
  const loadingMessage = document.getElementById("loadingMessage");
  if (loadingMessage) {
    loadingMessage.classList.add("d-none");
  }
}

function showSuccessMessage() {
  const successMessage = document.getElementById("successMessage");
  if (successMessage) {
    successMessage.classList.remove("d-none");
    setTimeout(() => {
      successMessage.classList.add("d-none");
    }, 2000);
  }
}

async function sendEmail(formData) {
  const csrfToken = await fetchCsrfToken();
  if (!csrfToken) {
    console.error("CSRF token is missing.");
    hideLoadingSpinner();
    return;
  }
  formData._csrf = csrfToken;
  fetch(prefix + "/send-email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-csrf-token": csrfToken,
    },
    body: JSON.stringify(formData),
    credentials: "include",
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("An error occurred. Please try again later.");
      }
      return response.json();
    })
    .then(() => {
      hideLoadingSpinner();
      showSuccessMessage();
    })
    .catch((error) => {
      console.error("Error sending email:", error);
      hideLoadingSpinner();
    });

  resetForm();
}

function resetForm() {
  setTimeout(() => {
    const form = document.getElementById("myForm");
    if (form) form.reset();
    if (window.grecaptcha) grecaptcha.reset();
    recaptchaComplete = false;
  }, 2000);
}
