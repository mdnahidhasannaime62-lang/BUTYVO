const SUPABASE_URL = "https://avvwhsoikoybszrlkjzl.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_dkf8SxvQ8q1jw_tCPiHA8g_ulProIqn";

const { createClient } = window.supabase;
const supabaseClient = createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);

const loginTab = document.getElementById("loginTab");
const signupTab = document.getElementById("signupTab");

const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");

// Login ↔ Sign Up
loginTab.addEventListener("click", function () {
  loginForm.classList.remove("hidden");
  signupForm.classList.add("hidden");

  loginTab.classList.add("active");
  signupTab.classList.remove("active");
});

signupTab.addEventListener("click", function () {
  signupForm.classList.remove("hidden");
  loginForm.classList.add("hidden");

  signupTab.classList.add("active");
  loginTab.classList.remove("active");
});

// Sign Up
signupForm.addEventListener("submit", async function (event) {
  event.preventDefault();

  const inputs = signupForm.querySelectorAll("input");

  const fullName = inputs[0].value.trim();
  const email = inputs[1].value.trim();
  const password = inputs[2].value;

  const { data, error } = await supabaseClient.auth.signUp({
    email: email,
    password: password,
    options: {
      data: {
        full_name: fullName
      }
    }
  });

  if (error) {
    alert(error.message);
    return;
  }

  alert("Account created successfully!");

  if (data.session) {
    window.location.href = "home.html";
  } else {
    alert("Check your email to confirm your account.");
  }
});

// Login
loginForm.addEventListener("submit", async function (event) {
  event.preventDefault();

  const inputs = loginForm.querySelectorAll("input");

  const email = inputs[0].value.trim();
  const password = inputs[1].value;

  const { error } = await supabaseClient.auth.signInWithPassword({
    email: email,
    password: password
  });

  if (error) {
    alert(error.message);
    return;
  }

  window.location.href = "home.html";
});