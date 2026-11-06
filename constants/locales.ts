// constants/locales.ts

export type SupportedLocale = "en" | "es" | "fr" | "ar" | "zh";

export interface TranslationDictionary {
  drawNextWinner: string;
  resetPool: string;
  remaining: string;
  drawnLog: string;
  awaitingDraw: string;
  selectMechanic: string;
  step1Title: string;
  step2Title: string;
  step3Title: string;
  customBackdrop: string;
  fontFamily: string;
  hexColor: string;
  motionLoop: string;
  exitBtn: string;
}

export const LOCALES: Record<SupportedLocale, TranslationDictionary> = {
  en: {
    drawNextWinner: "Draw Next Winner",
    resetPool: "Reset Pool",
    remaining: "Remaining",
    drawnLog: "Drawn Log",
    awaitingDraw: "Awaiting Draw Order...",
    selectMechanic: "Select Drawing Mechanics Model",
    step1Title: "Step 1: Select Drawing Mechanics Model",
    step2Title: "Step 2: Ingest Spreadsheet Rows",
    step3Title: "Step 3: Custom Canvas Theme Controls",
    customBackdrop: "Custom Backdrop Image",
    fontFamily: "Google Font Family String",
    hexColor: "Text Hex Color Code",
    motionLoop: "CSS Reveal Motion Loop",
    exitBtn: "← Exit to Directory",
  },
  es: {
    drawNextWinner: "Elegir Ganador Siguiente",
    resetPool: "Reiniciar Sorteo",
    remaining: "Restantes",
    drawnLog: "Registro de Ganadores",
    awaitingDraw: "Esperando Orden de Sorteo...",
    selectMechanic: "Seleccionar Modelo Mecánico de Sorteo",
    step1Title: "Paso 1: Seleccionar Modelo Mecánico",
    step2Title: "Paso 2: Cargar Filas de Hoja de Cálculo",
    step3Title: "Paso 3: Controles Temáticos de Lienzo",
    customBackdrop: "Imagen de Fondo Personalizada",
    fontFamily: "Fuente de Google",
    hexColor: "Código de Color de Texto Hex",
    motionLoop: "Bucle de Movimiento de Revelación",
    exitBtn: "← Salir al Directorio",
  },
  fr: {
    drawNextWinner: "Tirer le Gagnant Suivant",
    resetPool: "Réinitialiser le Tirage",
    remaining: "Restants",
    drawnLog: "Historique des Tirages",
    awaitingDraw: "En Attente de l'Ordre de Tirage...",
    selectMechanic: "Sélectionner le Modèle Mécanique",
    step1Title: "Étape 1: Sélectionner le Modèle",
    step2Title: "Étape 2: Charger la Liste de Noms",
    step3Title: "Étape 3: Contrôles Thématiques",
    customBackdrop: "Image de Fond Personnalisée",
    fontFamily: "Police Google Font",
    hexColor: "Code Couleur de Texte Hex",
    motionLoop: "Boucle de Mouvement de Révélation",
    exitBtn: "← Quitter vers le Répertoire",
  },
  ar: {
    drawNextWinner: "سحب الفائز التالي",
    resetPool: "إعادة ضبط السحب",
    remaining: "المتبقي",
    drawnLog: "سجل السحوبات",
    awaitingDraw: "في انتظار أمر السحب...",
    selectMechanic: "اختر نوع سحب القرعة",
    step1Title: "الخطوة ١: اختر طريقة السحب",
    step2Title: "الخطوة ٢: تحميل قوائم الأسماء",
    step3Title: "الخطوة ٣: التحكم في مظهر العرض",
    customBackdrop: "صورة خلفية مخصصة",
    fontFamily: "خط جوجل",
    hexColor: "رمز لون النص الهيكس",
    motionLoop: "تأثير حركة الكشف",
    exitBtn: "← الخروج إلى الدليل",
  },
  zh: {
    drawNextWinner: "抽取下一位得獎者",
    resetPool: "重設抽獎池",
    remaining: "未獲獎者人數/票數",
    drawnLog: "獲長者名單/票號",
    awaitingDraw: "等待抽獎指令...",
    selectMechanic: "選擇抽獎機制",
    step1Title: "第一步：選擇抽獎機制模型",
    step2Title: "第二步：導入試算表名單",
    step3Title: "第三步：自定義畫布主題控制",
    customBackdrop: "自訂背景圖",
    fontFamily: "Google 字體系列名稱",
    hexColor: "文字網頁十六進制顏色代碼",
    motionLoop: "CSS 動態揭曉效果",
    exitBtn: "← 返回主目錄",
  },
};
