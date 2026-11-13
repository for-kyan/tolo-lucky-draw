// constants/locales.ts

export type SupportedLocale = "en" | "es" | "fr" | "ar" | "zh";

export interface TranslationDictionary {
  // Display & Core Draw Controls
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

  // Shared Navigation & Actions
  signOut: string;
  signingOut: string;
  copyScreenLink: string;
  copiedLink: string;

  // Manage Hub & Operator Directory
  workspaceDirectory: string;
  systemAdmin: string;
  activeDrawsDir: string;
  activeDrawsSubtitle: string;
  newDrawPlaceholder: string;
  createNewDraw: string;
  noActiveDrawsTitle: string;
  noActiveDrawsDesc: string;
  colDrawName: string;
  colRoomId: string;
  colCreated: string;
  colActions: string;
  openWorkspace: string;
  deleteBtn: string;
  activeDrawsCountLabel: string;

  // Dashboard Aesthetics & Ingestion
  drawIdentityLabel: string;
  standardNamesLabel: string;
  standardNamesDesc: string;
  weightedSheetLabel: string;
  weightedSheetDesc: string;
  numbersGenLabel: string;
  numbersGenDesc: string;
  loadNamesPrompt: string;
  displayStylingTitle: string;
  resetStylingBtn: string;
  fontSizeLabel: string;
  fontBgLabel: string;
  bgBlurLabel: string;
  screenPosLabel: string;
  posTop: string;
  posMiddle: string;
  posBottom: string;
  extraColLabel: string;
  extraHidden: string;
  extraAbove: string;
  extraBelow: string;
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
    step3Title: "Step 3: Identity Presentation View Mode",
    customBackdrop: "Custom Backdrop Image",
    fontFamily: "Google Font Family",
    hexColor: "Text Hex Color",
    motionLoop: "Reveal Animation",
    exitBtn: "← Exit",

    signOut: "Sign Out",
    signingOut: "Signing Out...",
    copyScreenLink: "Copy Public Screen Link",
    copiedLink: "✓ Copied!",

    workspaceDirectory: "Workspace Directory",
    systemAdmin: "System Administration",
    activeDrawsDir: "Active Draws Directory",
    activeDrawsSubtitle: "Create a raffle workspace below to configure entries and launch the display screen.",
    newDrawPlaceholder: "e.g. Corporate Gala Draw",
    createNewDraw: "Create New Draw",
    noActiveDrawsTitle: "No active draws yet",
    noActiveDrawsDesc: "Enter an event name above to create a private, browser-based draw room.",
    colDrawName: "Draw Name",
    colRoomId: "Room ID",
    colCreated: "Created",
    colActions: "Actions",
    openWorkspace: "Open Workspace",
    deleteBtn: "Delete",
    activeDrawsCountLabel: "Active Draws",

    drawIdentityLabel: "Draw Identity Label",
    standardNamesLabel: "Standard Names List",
    standardNamesDesc: "Basic single spreadsheet entry rows.",
    weightedSheetLabel: "Weighted Spreadsheet",
    weightedSheetDesc: "Handles weights or ticket number ranges (e.g. 1-150).",
    numbersGenLabel: "Numbers Generator",
    numbersGenDesc: "Populates numeric entries directly inside client RAM.",
    loadNamesPrompt: "Load Names List (.xlsx)",
    displayStylingTitle: "Display Screen Styling",
    resetStylingBtn: "Reset Styling",
    fontSizeLabel: "Font Size",
    fontBgLabel: "Font Background",
    bgBlurLabel: "Background Blur",
    screenPosLabel: "Display Screen Position",
    posTop: "Top Third",
    posMiddle: "Middle Third",
    posBottom: "Bottom Third",
    extraColLabel: "Extra Excel Column Line",
    extraHidden: "Hidden",
    extraAbove: "Above Main",
    extraBelow: "Below Main",
  },
  es: {
    drawNextWinner: "Elegir Ganador Siguiente",
    resetPool: "Reiniciar Sorteo",
    remaining: "Restantes",
    drawnLog: "Registro de Ganadores",
    awaitingDraw: "Esperando Orden de Sorteo...",
    selectMechanic: "Seleccionar Modelo de Sorteo",
    step1Title: "Paso 1: Seleccionar Modelo de Sorteo",
    step2Title: "Paso 2: Cargar Hoja de Cálculo",
    step3Title: "Paso 3: Modo de Presentación",
    customBackdrop: "Imagen de Fondo",
    fontFamily: "Fuente de Google",
    hexColor: "Color de Texto Hex",
    motionLoop: "Animación de Revelación",
    exitBtn: "← Salir",

    signOut: "Cerrar Sesión",
    signingOut: "Cerrando...",
    copyScreenLink: "Copiar Enlace de Pantalla",
    copiedLink: "✓ ¡Copiado!",

    workspaceDirectory: "Directorio de Espacios",
    systemAdmin: "Administración del Sistema",
    activeDrawsDir: "Directorio de Sorteos Activos",
    activeDrawsSubtitle: "Cree un espacio de sorteo a continuación para configurar participantes y abrir la pantalla.",
    newDrawPlaceholder: "ej. Sorteo Gala Corporativa",
    createNewDraw: "Crear Nuevo Sorteo",
    noActiveDrawsTitle: "Aún no hay sorteos activos",
    noActiveDrawsDesc: "Ingrese un nombre arriba para crear una sala de sorteo privada en el navegador.",
    colDrawName: "Nombre del Sorteo",
    colRoomId: "ID de Sala",
    colCreated: "Creado",
    colActions: "Acciones",
    openWorkspace: "Abrir Espacio",
    deleteBtn: "Eliminar",
    activeDrawsCountLabel: "Sorteos Activos",

    drawIdentityLabel: "Nombre del Sorteo",
    standardNamesLabel: "Lista Estándar de Nombres",
    standardNamesDesc: "Filas básicas de entrada única.",
    weightedSheetLabel: "Hoja Ponderada",
    weightedSheetDesc: "Admite pesos o rangos de boletos (ej. 1-150).",
    numbersGenLabel: "Generador de Números",
    numbersGenDesc: "Genera entradas numéricas directamente en memoria.",
    loadNamesPrompt: "Cargar Lista de Nombres (.xlsx)",
    displayStylingTitle: "Estilo de Pantalla Pública",
    resetStylingBtn: "Restablecer Estilo",
    fontSizeLabel: "Tamaño de Fuente",
    fontBgLabel: "Fondo del Texto",
    bgBlurLabel: "Desenfoque de Fondo",
    screenPosLabel: "Posición en Pantalla",
    posTop: "Tercio Superior",
    posMiddle: "Tercio Medio",
    posBottom: "Tercio Inferior",
    extraColLabel: "Línea Extra de Excel",
    extraHidden: "Oculta",
    extraAbove: "Arriba",
    extraBelow: "Abajo",
  },
  fr: {
    drawNextWinner: "Tirer le Gagnant Suivant",
    resetPool: "Réinitialiser le Tirage",
    remaining: "Restants",
    drawnLog: "Historique des Tirages",
    awaitingDraw: "En Attente de l'Ordre de Tirage...",
    selectMechanic: "Sélectionner le Modèle de Tirage",
    step1Title: "Étape 1 : Sélectionner le Modèle",
    step2Title: "Étape 2 : Charger la Feuille de Calcul",
    step3Title: "Étape 3 : Mode d'Affichage",
    customBackdrop: "Image d'Arrière-Plan",
    fontFamily: "Police Google Font",
    hexColor: "Couleur du Texte Hex",
    motionLoop: "Animation de Révélation",
    exitBtn: "← Quitter",

    signOut: "Déconnexion",
    signingOut: "Déconnexion...",
    copyScreenLink: "Copier le Lien d'Écran",
    copiedLink: "✓ Copié !",

    workspaceDirectory: "Répertoire des Espaces",
    systemAdmin: "Administration Système",
    activeDrawsDir: "Répertoire des Tirages Actifs",
    activeDrawsSubtitle: "Créez un espace ci-dessous pour configurer les participants et lancer l'écran public.",
    newDrawPlaceholder: "ex. Tirage Gala d'Entreprise",
    createNewDraw: "Créer un Tirage",
    noActiveDrawsTitle: "Aucun tirage actif",
    noActiveDrawsDesc: "Saisissez un nom ci-dessus pour créer une salle privée dans votre navigateur.",
    colDrawName: "Nom du Tirage",
    colRoomId: "ID de Salle",
    colCreated: "Créé le",
    colActions: "Actions",
    openWorkspace: "Ouvrir l'Espace",
    deleteBtn: "Supprimer",
    activeDrawsCountLabel: "Tirages Actifs",

    drawIdentityLabel: "Identifiant du Tirage",
    standardNamesLabel: "Liste Standard",
    standardNamesDesc: "Lignes simples d'une entrée par participant.",
    weightedSheetLabel: "Feuille Pondérée",
    weightedSheetDesc: "Gère les poids ou plages de billets (ex. 1-150).",
    numbersGenLabel: "Générateur de Numéros",
    numbersGenDesc: "Génère des numéros directement en mémoire.",
    loadNamesPrompt: "Charger la Liste (.xlsx)",
    displayStylingTitle: "Style de l'Écran Public",
    resetStylingBtn: "Réinitialiser le Style",
    fontSizeLabel: "Taille de Police",
    fontBgLabel: "Fond du Texte",
    bgBlurLabel: "Flou d'Arrière-Plan",
    screenPosLabel: "Position à l'Écran",
    posTop: "Tiers Supérieur",
    posMiddle: "Tiers Central",
    posBottom: "Tiers Inférieur",
    extraColLabel: "Ligne Excel Supplémentaire",
    extraHidden: "Masquée",
    extraAbove: "Au-dessus",
    extraBelow: "En dessous",
  },
  ar: {
    drawNextWinner: "سحب الفائز التالي",
    resetPool: "إعادة ضبط السحب",
    remaining: "المتبقي",
    drawnLog: "سجل السحوبات",
    awaitingDraw: "في انتظار أمر السحب...",
    selectMechanic: "اختر نوع سحب القرعة",
    step1Title: "الخطوة ١: اختر طريقة السحب",
    step2Title: "الخطوة ٢: تحميل جدول البيانات",
    step3Title: "الخطوة ٣: وضع عرض النتيجة",
    customBackdrop: "صورة خلفية مخصصة",
    fontFamily: "خط جوجل",
    hexColor: "رمز لون النص",
    motionLoop: "تأثير حركة الكشف",
    exitBtn: "← خروج",

    signOut: "تسجيل الخروج",
    signingOut: "جاري الخروج...",
    copyScreenLink: "نسخ رابط شاشة العرض",
    copiedLink: "✓ تم النسخ!",

    workspaceDirectory: "دليل مساحات العمل",
    systemAdmin: "إدارة النظام",
    activeDrawsDir: "دليل السحوبات النشطة",
    activeDrawsSubtitle: "أنشئ مساحة سحب أدناه لإعداد المشاركين وتشغيل شاشة العرض.",
    newDrawPlaceholder: "مثال: سحب الحفل السنوي",
    createNewDraw: "إنشاء سحب جديد",
    noActiveDrawsTitle: "لا توجد سحوبات نشطة حالياً",
    noActiveDrawsDesc: "أدخل اسماً أعلاه لإنشاء غرفة سحب خاصة في ذاكرة المتصفح.",
    colDrawName: "اسم السحب",
    colRoomId: "رمز الغرفة",
    colCreated: "تاريخ الإنشاء",
    colActions: "الإجراءات",
    openWorkspace: "فتح المساحة",
    deleteBtn: "حذف",
    activeDrawsCountLabel: "السحوبات النشطة",

    drawIdentityLabel: "عنوان السحب",
    standardNamesLabel: "قائمة أسماء قياسية",
    standardNamesDesc: "صفوف أساسية لكل مشارك.",
    weightedSheetLabel: "جدول بأوزان أو نطاقات",
    weightedSheetDesc: "يدعم عدد الفرص أو نطاقات التذاكر (مثل 1-150).",
    numbersGenLabel: "مولد الأرقام",
    numbersGenDesc: "إنشاء أرقام تسلسلية مباشرة في الذاكرة.",
    loadNamesPrompt: "تحميل قائمة الأسماء (.xlsx)",
    displayStylingTitle: "تنسيق شاشة العرض",
    resetStylingBtn: "إعادة ضبط التنسيق",
    fontSizeLabel: "حجم الخط",
    fontBgLabel: "خلفية النص",
    bgBlurLabel: "تمويه الخلفية",
    screenPosLabel: "موضع العرض على الشاشة",
    posTop: "الثلث العلوي",
    posMiddle: "الثلث الأوسط",
    posBottom: "الثلث السفلي",
    extraColLabel: "سطر العمود الإضافي",
    extraHidden: "مخفي",
    extraAbove: "أعلى الاسم",
    extraBelow: "أسفل الاسم",
  },
  zh: {
    drawNextWinner: "抽取下一位得獎者",
    resetPool: "重設抽獎池",
    remaining: "未獲獎人數/票數",
    drawnLog: "獲獎者名單/票號",
    awaitingDraw: "等待抽獎指令...",
    selectMechanic: "選擇抽獎機制",
    step1Title: "第一步：選擇抽獎機制模型",
    step2Title: "第二步：匯入試算表名單",
    step3Title: "第三步：顯示模式設定",
    customBackdrop: "自訂背景圖片",
    fontFamily: "Google 字體名稱",
    hexColor: "文字十六進制色碼",
    motionLoop: "揭曉動畫效果",
    exitBtn: "← 返回目錄",

    signOut: "登出",
    signingOut: "登出中...",
    copyScreenLink: "複製公開顯示螢幕連結",
    copiedLink: "✓ 已複製！",

    workspaceDirectory: "工作區目錄",
    systemAdmin: "系統管理",
    activeDrawsDir: "進行中的抽獎目錄",
    activeDrawsSubtitle: "在下方建立抽獎工作區以設定名單並啟動公開顯示畫面。",
    newDrawPlaceholder: "例如：企業年會抽獎",
    createNewDraw: "建立新抽獎",
    noActiveDrawsTitle: "尚無進行中的抽獎",
    noActiveDrawsDesc: "在上方輸入活動名稱，即可於瀏覽器記憶體建立獨立抽獎室。",
    colDrawName: "抽獎名稱",
    colRoomId: "頻道代碼",
    colCreated: "建立日期",
    colActions: "操作",
    openWorkspace: "開啟工作區",
    deleteBtn: "刪除",
    activeDrawsCountLabel: "進行中抽獎",

    drawIdentityLabel: "抽獎活動標題",
    standardNamesLabel: "標準名單列表",
    standardNamesDesc: "每列代表單一抽獎資格。",
    weightedSheetLabel: "加權試算表",
    weightedSheetDesc: "支援權重次數或票號區間（例如 1-150）。",
    numbersGenLabel: "數字生成器",
    numbersGenDesc: "直接在瀏覽器記憶體生成連續數字。",
    loadNamesPrompt: "載入名單檔案 (.xlsx)",
    displayStylingTitle: "顯示螢幕樣式設定",
    resetStylingBtn: "重設樣式",
    fontSizeLabel: "字體大小",
    fontBgLabel: "文字背景框",
    bgBlurLabel: "背景模糊度",
    screenPosLabel: "螢幕顯示位置",
    posTop: "畫面頂部三分之一",
    posMiddle: "畫面中央",
    posBottom: "畫面底部三分之一",
    extraColLabel: "額外 Excel 欄位副標",
    extraHidden: "隱藏",
    extraAbove: "顯示於主文字上方",
    extraBelow: "顯示於主文字下方",
  },
};
