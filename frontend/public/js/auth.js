
import { app } from "../firebase-config.js";

import {
  getAuth,
  RecaptchaVerifier,
  signInWithPhoneNumber
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";


// ======================================================
// CONFIG
// ======================================================

const API_URL = "https://tirupati-matka.onrender.com/api/auth";

const auth = getAuth(app);


// ======================================================
// ELEMENTS
// ======================================================

const pages = document.querySelectorAll(".page");
const steps = document.querySelectorAll(".step");

const card = document.getElementById("authCard");


// ======================================================
// REGISTRATION DATA
// ======================================================

let currentStep = 0;

let userData = {
  phone: "",
  name: "",
  password: "",
  referral: "",
  mpin: ""
};


// ======================================================
// PAGE STATE
// ======================================================

let isPageChanging = false;


// ======================================================
// PAGE ANIMATION
// ======================================================

function showPage(id) {

  if (isPageChanging) return;

  const currentPage =
    document.querySelector(".page.active");

  const nextPage =
    document.getElementById(id);

  if (!nextPage || currentPage === nextPage) {
    return;
  }

  isPageChanging = true;


  // --------------------------------------------------
  // UPDATE PROGRESS
  // --------------------------------------------------

  steps.forEach(step => {
    step.classList.remove("active");
  });

  for (let i = 0; i <= currentStep; i++) {

    if (steps[i]) {
      steps[i].classList.add("active");
    }

  }


  // --------------------------------------------------
  // OUTGOING PAGE
  // --------------------------------------------------

  if (currentPage) {

    currentPage.classList.add("page-exit");

    currentPage.addEventListener(
      "animationend",
      () => {

        currentPage.classList.remove(
          "active",
          "page-exit"
        );


        // ------------------------------------------------
        // INCOMING PAGE
        // ------------------------------------------------

        nextPage.classList.add("active");

        void nextPage.offsetWidth;

        nextPage.classList.add("page-enter");


        nextPage.addEventListener(
          "animationend",
          () => {

            nextPage.classList.remove(
              "page-enter"
            );

            isPageChanging = false;

          },
          {
            once: true
          }
        );

      },
      {
        once: true
      }
    );

  } else {

    nextPage.classList.add("active");

    isPageChanging = false;

  }

}


// ======================================================
// BUTTON LOADING
// ======================================================

function setButtonLoading(
  button,
  loading,
  text = "Please wait..."
) {

  if (!button) return;

  if (loading) {

    button.disabled = true;

    button.dataset.originalText =
      button.innerHTML;

    button.innerHTML = `
      <span>
        <i class="fa-solid fa-spinner fa-spin"></i>
        ${text}
      </span>
    `;

  } else {

    button.disabled = false;

    if (button.dataset.originalText) {

      button.innerHTML =
        button.dataset.originalText;

    }

  }

}


// ======================================================
// RECAPTCHA
// ======================================================

function createRecaptcha() {

  try {

    if (window.recaptchaVerifier) {

      try {
        window.recaptchaVerifier.clear();
      } catch (error) {
        console.warn(
          "reCAPTCHA clear warning:",
          error
        );
      }

    }


    window.recaptchaVerifier =
      new RecaptchaVerifier(
        auth,
        "recaptcha-container",
        {
          size: "invisible",

          callback: () => {
            console.log(
              "✅ reCAPTCHA verified"
            );
          },

          "expired-callback": () => {
            console.log(
              "⚠️ reCAPTCHA expired"
            );
          }
        }
      );

  } catch (error) {

    console.error(
      "RECAPTCHA ERROR:",
      error
    );

  }

}


createRecaptcha();


// ======================================================
// SEND FIREBASE SMS OTP
// ======================================================

document
  .getElementById("sendOtpBtn")
  .onclick = async () => {

    const button =
      document.getElementById(
        "sendOtpBtn"
      );


    let phone =
      document
        .getElementById("phone")
        .value
        .trim()
        .replace(/\D/g, "");


    // --------------------------------------------------
    // VALIDATE PHONE
    // --------------------------------------------------

    if (!/^[6-9]\d{9}$/.test(phone)) {

      alert(
        "Enter a valid 10-digit Indian mobile number."
      );

      return;
    }


    try {

      setButtonLoading(
        button,
        true,
        "Sending OTP..."
      );


      // ------------------------------------------------
      // MAKE SURE RECAPTCHA EXISTS
      // ------------------------------------------------

      if (!window.recaptchaVerifier) {
        createRecaptcha();
      }


      // ------------------------------------------------
      // SEND OTP
      // ------------------------------------------------

      const confirmationResult =
        await signInWithPhoneNumber(
          auth,
          "+91" + phone,
          window.recaptchaVerifier
        );


      window.confirmationResult =
        confirmationResult;


      userData.phone = phone;


      console.log(
        "✅ Firebase OTP sent"
      );


      // ------------------------------------------------
      // MOVE TO OTP
      // ------------------------------------------------

      currentStep = 1;

      showPage("otpPage");


      setTimeout(() => {

        document
          .getElementById("otp")
          ?.focus();

      }, 650);


      alert(
        "OTP sent successfully to your mobile number."
      );

    } catch (error) {

      console.error(
        "SEND OTP ERROR:",
        error
      );


      createRecaptcha();


      alert(
        error?.message ||
        "Unable to send OTP."
      );

    } finally {

      setButtonLoading(
        button,
        false
      );

    }

  };


// ======================================================
// VERIFY FIREBASE OTP
// ======================================================

document
  .getElementById("verifyBtn")
  .onclick = async () => {

    const button =
      document.getElementById(
        "verifyBtn"
      );


    const otp =
      document
        .getElementById("otp")
        .value
        .trim();


    if (!/^\d{6}$/.test(otp)) {

      alert(
        "Please enter the 6-digit SMS OTP."
      );

      return;
    }


    if (!window.confirmationResult) {

      alert(
        "Please request an OTP first."
      );

      return;
    }


    try {

      setButtonLoading(
        button,
        true,
        "Verifying..."
      );


      const result =
        await window
          .confirmationResult
          .confirm(otp);


      if (!result?.user) {

        throw new Error(
          "Firebase verification failed."
        );

      }


      console.log(
        "✅ Firebase phone verified:",
        result.user.uid
      );


      currentStep = 2;

      showPage("namePage");


      setTimeout(() => {

        document
          .getElementById("fullName")
          ?.focus();

      }, 650);

    } catch (error) {

      console.error(
        "VERIFY OTP ERROR:",
        error
      );


      alert(
        "Invalid or expired OTP. Please try again."
      );

    } finally {

      setButtonLoading(
        button,
        false
      );

    }

  };


// ======================================================
// NAME
// ======================================================

document
  .getElementById("nextBtn")
  .onclick = () => {

    const name =
      document
        .getElementById("fullName")
        .value
        .trim();


    if (name.length < 2) {

      alert(
        "Please enter your full name."
      );

      return;
    }


    userData.name = name;


    currentStep = 3;

    showPage("passwordPage");


    setTimeout(() => {

      document
        .getElementById("password")
        ?.focus();

    }, 650);

  };


// ======================================================
// PASSWORD
// ======================================================

document
  .getElementById("passwordBtn")
  .onclick = () => {

    const password =
      document
        .getElementById("password")
        .value;


    if (password.length < 6) {

      alert(
        "Password must be at least 6 characters."
      );

      return;
    }


    userData.password = password;


    currentStep = 4;

    showPage("referralPage");


    setTimeout(() => {

      document
        .getElementById("referral")
        ?.focus();

    }, 650);

  };


// ======================================================
// REFERRAL + REGISTER
// ======================================================

document
  .getElementById("createBtn")
  .onclick = async () => {

    const button =
      document.getElementById(
        "createBtn"
      );


    const referral =
      document
        .getElementById("referral")
        .value
        .trim();


    userData.referral =
      referral;


    // --------------------------------------------------
    // CHECK FIREBASE USER
    // --------------------------------------------------

    const firebaseUser =
      auth.currentUser;


    if (!firebaseUser) {

      alert(
        "Please verify your mobile number first."
      );

      currentStep = 1;

      showPage("otpPage");

      return;
    }


    try {

      setButtonLoading(
        button,
        true,
        "Creating account..."
      );


      // ------------------------------------------------
      // FIREBASE TOKEN
      // ------------------------------------------------

      const idToken =
        await firebaseUser.getIdToken(true);


      console.log(
        "✅ Firebase ID token received"
      );


      // ------------------------------------------------
      // BACKEND REGISTER
      // ------------------------------------------------

      const response =
        await fetch(
          API_URL + "/register",
          {
            method: "POST",

            headers: {

              "Content-Type":
                "application/json",

              "Authorization":
                "Bearer " + idToken

            },

            body: JSON.stringify({

              name:
                userData.name,

              phone:
                userData.phone,

              password:
                userData.password,

              confirmPassword:
                userData.password,

              referralCode:
                userData.referral

            })

          }
        );


      const data =
        await response.json();


      console.log(
        "REGISTER RESPONSE:",
        data
      );


      // ------------------------------------------------
      // FAILED
      // ------------------------------------------------

      if (
        !response.ok ||
        !data.success
      ) {

        alert(
          data.message ||
          "Registration failed."
        );

        return;
      }


      // ------------------------------------------------
      // SAVE JWT
      // ------------------------------------------------

      if (data.token) {

        localStorage.setItem(
          "token",
          data.token
        );

        localStorage.setItem(
          "ki_token",
          data.token
        );

      }


      // ------------------------------------------------
      // SAVE USER
      // ------------------------------------------------

      if (data.user) {

        localStorage.setItem(
          "user",
          JSON.stringify(
            data.user
          )
        );

      }


      console.log(
        "✅ Backend registration successful"
      );


      // ------------------------------------------------
      // CREATE M-PIN
      // ------------------------------------------------

      currentStep = 5;

      showPage("mpinPage");


      setTimeout(() => {

        document
          .getElementById("mpin")
          ?.focus();

      }, 650);

    } catch (error) {

      console.error(
        "REGISTRATION ERROR:",
        error
      );


      alert(
        "Unable to create account. Please try again."
      );

    } finally {

      setButtonLoading(
        button,
        false
      );

    }

  };


// ======================================================
// CREATE M-PIN
// ======================================================

document
  .getElementById("mpinBtn")
  .onclick = async () => {

    const button =
      document.getElementById(
        "mpinBtn"
      );


    const mpin =
      document
        .getElementById("mpin")
        .value
        .trim();


    if (!/^\d{4}$/.test(mpin)) {

      alert(
        "M-PIN must contain exactly 4 digits."
      );

      return;
    }


    const token =
      localStorage.getItem(
        "token"
      );


    if (!token) {

      alert(
        "Your registration session has expired. Please register again."
      );

      window.location.href =
        "auth.html";

      return;
    }


    try {

      setButtonLoading(
        button,
        true,
        "Creating M-PIN..."
      );


      const response =
        await fetch(
          API_URL + "/set-mpin",
          {
            method: "POST",

            headers: {

              "Content-Type":
                "application/json",

              "Authorization":
                "Bearer " + token

            },

            body: JSON.stringify({
              mpin
            })

          }
        );


      const data =
        await response.json();


      console.log(
        "SET MPIN RESPONSE:",
        data
      );


      if (
        !response.ok ||
        !data.success
      ) {

        alert(
          data.message ||
          "Unable to create M-PIN."
        );

        return;
      }


      // ------------------------------------------------
      // UPDATE LOCAL USER
      // ------------------------------------------------

      try {

        const savedUser =
          JSON.parse(
            localStorage.getItem(
              "user"
            ) || "{}"
          );


        savedUser.mpinSet = true;


        localStorage.setItem(
          "user",
          JSON.stringify(
            savedUser
          )
        );

      } catch (error) {

        console.warn(
          "Unable to update local user:",
          error
        );

      }


      // ------------------------------------------------
      // SUCCESS
      // ------------------------------------------------

      alert(
        "Account created successfully!"
      );


      window.location.href =
        "gamezone.html";


    } catch (error) {

      console.error(
        "SET MPIN ERROR:",
        error
      );


      alert(
        "Server error while creating M-PIN."
      );

    } finally {

      setButtonLoading(
        button,
        false
      );

    }

  };


// ======================================================
// PHONE INPUT
// ======================================================

const phoneInput =
  document.getElementById(
    "phone"
  );

if (phoneInput) {

  phoneInput.addEventListener(
    "input",
    () => {

      phoneInput.value =
        phoneInput.value
          .replace(/\D/g, "")
          .slice(0, 10);

    }
  );

}


// ======================================================
// OTP INPUT
// ======================================================

const otpInput =
  document.getElementById(
    "otp"
  );

if (otpInput) {

  otpInput.addEventListener(
    "input",
    () => {

      otpInput.value =
        otpInput.value
          .replace(/\D/g, "")
          .slice(0, 6);

    }
  );

}


// ======================================================
// M-PIN INPUT
// ======================================================

const mpinInput =
  document.getElementById(
    "mpin"
  );

if (mpinInput) {

  mpinInput.addEventListener(
    "input",
    () => {

      mpinInput.value =
        mpinInput.value
          .replace(/\D/g, "")
          .slice(0, 4);

    }
  );

}


// ======================================================
// REFERRAL UPPERCASE
// ======================================================

const referralInput =
  document.getElementById(
    "referral"
  );

if (referralInput) {

  referralInput.addEventListener(
    "input",
    () => {

      referralInput.value =
        referralInput.value
          .replace(/\s/g, "")
          .toUpperCase();

    }
  );

}


// ======================================================
// ENTER KEY SUPPORT
// ======================================================

document.addEventListener(
  "keydown",
  event => {

    if (
      event.key !== "Enter"
    ) {
      return;
    }


    const activePage =
      document.querySelector(
        ".page.active"
      );


    if (!activePage) {
      return;
    }


    const button =
      activePage.querySelector(
        "button"
      );


    if (
      button &&
      !button.disabled
    ) {

      event.preventDefault();

      button.click();

    }

  }
);


// ======================================================
// PREMIUM MAGNETIC CARD
// ======================================================

if (
  card &&
  window.matchMedia(
    "(pointer:fine)"
  ).matches
) {

  let raf = null;

  document.addEventListener(
    "mousemove",
    event => {

      if (raf) return;

      raf =
        requestAnimationFrame(
          () => {

            raf = null;


            const rect =
              card.getBoundingClientRect();


            const centerX =
              rect.left +
              rect.width / 2;


            const centerY =
              rect.top +
              rect.height / 2;


            const x =
              (event.clientX -
                centerX) /
              rect.width;


            const y =
              (event.clientY -
                centerY) /
              rect.height;


            const rotateY =
              x * 5;


            const rotateX =
              y * -5;


            const moveX =
              x * 3;


            const moveY =
              y * 3;


            card.style.transform =
              `
              perspective(1200px)
              translate3d(
                ${moveX}px,
                ${moveY}px,
                0
              )
              rotateX(${rotateX}deg)
              rotateY(${rotateY}deg)
              `;


            card.style.setProperty(
              "--mouse-x",
              `${((event.clientX - rect.left) / rect.width) * 100}%`
            );


            card.style.setProperty(
              "--mouse-y",
              `${((event.clientY - rect.top) / rect.height) * 100}%`
            );

          }
        );

    }
  );


  document.addEventListener(
    "mouseleave",
    () => {

      card.style.transform =
        `
        perspective(1200px)
        translate3d(0,0,0)
        rotateX(0deg)
        rotateY(0deg)
        `;

    }
  );

}


// ======================================================
// INPUT MAGNETIC FOCUS
// ======================================================

document
  .querySelectorAll(
    ".input-full, .phone-box"
  )
  .forEach(element => {

    element.addEventListener(
      "focusin",
      () => {

        element.classList.add(
          "magnetic-focus"
        );

      }
    );


    element.addEventListener(
      "focusout",
      () => {

        element.classList.remove(
          "magnetic-focus"
        );

      }
    );

  });


// ======================================================
// MPIN DOT VISUALIZER
// ======================================================

if (mpinInput) {

  const dots =
    document.querySelectorAll(
      ".mpin-dots span"
    );


  mpinInput.addEventListener(
    "input",
    () => {

      const length =
        mpinInput.value.length;


      dots.forEach(
        (dot, index) => {

          dot.classList.toggle(
            "filled",
            index < length
          );

        }
      );

    }
  );

}


// ======================================================
// PAGE INITIALIZATION
// ======================================================

steps.forEach(
  (step, index) => {

    step.classList.toggle(
      "active",
      index === 0
    );

  }
);

console.log(
  "✅ Premium Tirupati Matka authentication loaded"
);

