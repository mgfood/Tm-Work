import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

// --- Russian namespaces ---
import ruAdmin from "./locales/ru/admin.json";
import ruAuth from "./locales/ru/auth.json";
import ruBilling from "./locales/ru/billing.json";
import ruButtons from "./locales/ru/buttons.json";
import ruCategories from "./locales/ru/categories.json";
import ruChat from "./locales/ru/chat.json";
import ruCommon from "./locales/ru/common.json";
import ruConfirmations from "./locales/ru/confirmations.json";
import ruContact from "./locales/ru/contact.json";
import ruCreateJob from "./locales/ru/create_job.json";
import ruDashboard from "./locales/ru/dashboard.json";
import ruEditJob from "./locales/ru/editJob.json";
import ruErrors from "./locales/ru/errors.json";
import ruFooter from "./locales/ru/footer.json";
import ruForgotPassword from "./locales/ru/forgotPassword.json";
import ruHome from "./locales/ru/home.json";
import ruJob from "./locales/ru/job.json";
import ruJobs from "./locales/ru/jobs.json";
import ruLogin from "./locales/ru/login.json";
import ruNav from "./locales/ru/nav.json";
import ruNotifications from "./locales/ru/notifications.json";
import ruProfile from "./locales/ru/profile.json";
import ruResetPassword from "./locales/ru/resetPassword.json";
import ruReviews from "./locales/ru/reviews.json";
import ruTalentList from "./locales/ru/talentList.json";
import ruToasts from "./locales/ru/toasts.json";
import ruVip from "./locales/ru/vip.json";
import ruWallet from "./locales/ru/wallet.json";

// --- Turkmen namespaces ---
import tkAdmin from "./locales/tk/admin.json";
import tkAuth from "./locales/tk/auth.json";
import tkBilling from "./locales/tk/billing.json";
import tkButtons from "./locales/tk/buttons.json";
import tkCategories from "./locales/tk/categories.json";
import tkChat from "./locales/tk/chat.json";
import tkCommon from "./locales/tk/common.json";
import tkConfirmations from "./locales/tk/confirmations.json";
import tkContact from "./locales/tk/contact.json";
import tkCreateJob from "./locales/tk/create_job.json";
import tkDashboard from "./locales/tk/dashboard.json";
import tkEditJob from "./locales/tk/editJob.json";
import tkErrors from "./locales/tk/errors.json";
import tkFooter from "./locales/tk/footer.json";
import tkForgotPassword from "./locales/tk/forgotPassword.json";
import tkHome from "./locales/tk/home.json";
import tkJob from "./locales/tk/job.json";
import tkJobs from "./locales/tk/jobs.json";
import tkLogin from "./locales/tk/login.json";
import tkNav from "./locales/tk/nav.json";
import tkNotifications from "./locales/tk/notifications.json";
import tkProfile from "./locales/tk/profile.json";
import tkResetPassword from "./locales/tk/resetPassword.json";
import tkReviews from "./locales/tk/reviews.json";
import tkTalentList from "./locales/tk/talentList.json";
import tkToasts from "./locales/tk/toasts.json";
import tkVip from "./locales/tk/vip.json";
import tkWallet from "./locales/tk/wallet.json";

// Merge all namespace objects into a single flat `translation` namespace.
// Each file contains only the inner content of its section (no wrapper key),
// so they are spread at the top level — no changes needed in any component.
const ruTranslation = {
  admin: ruAdmin,
  auth: ruAuth,
  billing: ruBilling,
  buttons: ruButtons,
  categories: ruCategories,
  chat: ruChat,
  common: ruCommon,
  confirmations: ruConfirmations,
  contact: ruContact,
  create_job: ruCreateJob,
  dashboard: ruDashboard,
  editJob: ruEditJob,
  errors: ruErrors,
  footer: ruFooter,
  forgotPassword: ruForgotPassword,
  home: ruHome,
  job: ruJob,
  jobs: ruJobs,
  login: ruLogin,
  nav: ruNav,
  notifications: ruNotifications,
  profile: ruProfile,
  resetPassword: ruResetPassword,
  reviews: ruReviews,
  talentList: ruTalentList,
  toasts: ruToasts,
  vip: ruVip,
  wallet: ruWallet,
};

const tkTranslation = {
  admin: tkAdmin,
  auth: tkAuth,
  billing: tkBilling,
  buttons: tkButtons,
  categories: tkCategories,
  chat: tkChat,
  common: tkCommon,
  confirmations: tkConfirmations,
  contact: tkContact,
  create_job: tkCreateJob,
  dashboard: tkDashboard,
  editJob: tkEditJob,
  errors: tkErrors,
  footer: tkFooter,
  forgotPassword: tkForgotPassword,
  home: tkHome,
  job: tkJob,
  jobs: tkJobs,
  login: tkLogin,
  nav: tkNav,
  notifications: tkNotifications,
  profile: tkProfile,
  resetPassword: tkResetPassword,
  reviews: tkReviews,
  talentList: tkTalentList,
  toasts: tkToasts,
  vip: tkVip,
  wallet: tkWallet,
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      ru: { translation: ruTranslation },
      tk: { translation: tkTranslation },
    },
    fallbackLng: "ru",
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;