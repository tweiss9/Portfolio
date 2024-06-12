let recaptchaSiteKey;
let recaptchaLoading = false;
let recaptchaComplete = false;
let isFormSubmitted = false;
const prefix = "https://us-central1-tylerhweiss.cloudfunctions.net/api";

document.addEventListener("DOMContentLoaded", function () {
  const navigationLinks = document.querySelectorAll(".nav-link");
  navigationLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      const sectionId = link.getAttribute("href");
      scrollToSection(sectionId);
    });
  });

  const homeLink = document.getElementById("home-link");
  if (homeLink) {
    homeLink.addEventListener("click", (event) => {
      event.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  } else {
    console.error("Could not find home-link element");
  }

  const submitButton = document.getElementById("submitButton");
  submitButton.addEventListener("click", handleSubmit);

  fetch(prefix + "/get-site-key")
    .then((response) => {
      if (!response.ok) {
        console.log("Response Status:", response.status);
        throw new Error("Failed to fetch reCAPTCHA site key");
      }
      return response.json();
    })
    .then((data) => {
      const recaptchaSiteKey = data.recaptchaSiteKey;

      const recaptchaDiv = document.getElementById("recaptchaDiv");
      recaptchaDiv.setAttribute("data-sitekey", recaptchaSiteKey);

      if (window.grecaptcha) {
        grecaptcha.ready(function () {
          isRecaptchaReady = true;
          grecaptcha.render("recaptchaDiv", {
            sitekey: recaptchaSiteKey,
            callback: checkRecaptchaStatus,
            "error-callback": onRecaptchaError,
          });
        });
      } else {
        console.error("grecaptcha is not defined.");
      }
    })
    .catch((error) => {
      console.error("Error fetching reCAPTCHA site key:", error);
    });
});

function scrollToSection(sectionId) {
  const targetSection = document.querySelector(sectionId);
  const navbarHeight = document.querySelector(".navbar").offsetHeight;
  const targetPosition =
    targetSection.getBoundingClientRect().top + window.scrollY - navbarHeight;
  window.scrollTo({ top: targetPosition, behavior: "smooth" });
}

function checkRecaptchaStatus() {
  recaptchaLoading = true;
  const recaptchaResponse = grecaptcha.getResponse();

  fetch(prefix + "/reCAPTCHA", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ "g-recaptcha-response": recaptchaResponse }),
  })
    .then((response) => {
      recaptchaLoading = false;
      return response.json();
    })
    .then((verificationResult) => {
      recaptchaLoading = false;
      if (verificationResult.success) {
        recaptchaComplete = true;
      } else {
        recaptchaComplete = false;
        console.error(
          "reCAPTCHA verification failed." + verificationResult.error
        );
      }
    })
    .catch((error) => {
      recaptchaComplete = false;
      recaptchaLoading = false;
      console.error("Error verifying reCAPTCHA:", error);
    });
}

function onRecaptchaError() {
  console.error("Error during reCAPTCHA verification.", error);
}

async function handleSubmit(event) {
  event.preventDefault();
  while (recaptchaLoading) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  const nameInput = document.getElementById("name");
  const emailInput = document.getElementById("email");
  const messageInput = document.getElementById("message");

  let isValid = true;
  isValid =
    toggleValidation(nameInput, !nameInput.value.trim(), "nameError") &&
    isValid;
  isValid =
    toggleValidation(
      emailInput,
      !emailInput.value.trim() ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput.value.trim()),
      "emailError"
    ) && isValid;
  isValid =
    toggleValidation(
      messageInput,
      !messageInput.value.trim(),
      "messageError"
    ) && isValid;
  isValid =
    toggleValidation(
      document.querySelector(".g-recaptcha"),
      !recaptchaComplete,
      "recaptchaError"
    ) && isValid;

  if (!isValid) return;

  const formData = {
    name: nameInput.value.trim(),
    email: emailInput.value.trim(),
    message: messageInput.value.trim(),
  };

  showLoadingSpinner();

  fetch(prefix + "/send-email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(formData),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error('An error occurred. Please try again later.');
      }
      return response.json();
    })
    .then(() => {
      hideLoadingSpinner();
      console.log("Email sent successfully!");
      showSuccessMessage();
    })
    .catch((error) => {
      console.error("Error sending email:", error);
      hideLoadingSpinner();
    });

  setTimeout(() => {
    document.getElementById("myForm").reset();
    grecaptcha.reset();
    recaptchaComplete = false;
  }, 2000);
}

function toggleValidation(inputField, condition, errorFieldId) {
  const errorField = document.getElementById(errorFieldId);
  if (inputField.classList.contains("g-recaptcha")) {
    const recaptchaErrorElement = document.getElementById("recaptchaError");
    if (!recaptchaComplete) {
      recaptchaErrorElement.classList.remove("d-none");
      recaptchaErrorElement.style.display = "block";
      return false;
    } else {
      recaptchaErrorElement.classList.add("d-none");
      return true;
    }
  } else if (condition) {
    inputField.classList.add("is-invalid");
    errorField.style.display = "block";
    return false;
  } else {
    inputField.classList.remove("is-invalid");
    errorField.style.display = "none";
    return true;
  }
}

function showLoadingSpinner() {
  const loadingMessage = document.getElementById("loadingMessage");
  loadingMessage.classList.remove("d-none");
}

function hideLoadingSpinner() {
  const loadingMessage = document.getElementById("loadingMessage");
  loadingMessage.classList.add("d-none");
}

function showSuccessMessage() {
  const successMessage = document.getElementById("successMessage");
  successMessage.classList.remove("d-none");
  setTimeout(() => {
    successMessage.classList.add("d-none");
  }, 2000);
}
