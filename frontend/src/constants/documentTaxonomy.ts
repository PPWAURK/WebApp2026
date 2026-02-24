export type LibraryModule = 'TRAINING' | 'POLICY' | 'MANAGEMENT' | 'FORMS';

export type LibrarySection =
  | 'RECIPE_TRAINING'
  | 'RECIPE'
  | 'MISE_EN_PLACE_SOP'
  | 'RED_RULES'
  | 'BLACK_RULES'
  | 'SALLE_TOOLS'
  | 'CUISINE_TOOLS'
  | 'MEAT_DATE_FORM'
  | 'CLEANING_FORM';

export type TaxonomyOption = {
  key: LibraryModule | LibrarySection;
  label: string;
};

export const moduleOptions: TaxonomyOption[] = [
  { key: 'TRAINING', label: "店铺培训 / ZHAO's Formation" },
  { key: 'POLICY', label: "公司规章制度 / Regles de l'entreprise" },
  { key: 'MANAGEMENT', label: '管理工具 / Outil de gestion' },
  { key: 'FORMS', label: '店铺日常使用表格 / Tableaux de restaurant' },
];

export const sectionsByModule: Record<LibraryModule, TaxonomyOption[]> = {
  TRAINING: [
    { key: 'RECIPE', label: '食谱 / Recette' },
    { key: 'MISE_EN_PLACE_SOP', label: '酱汁及半成品菜品出品 SOP' },
  ],
  POLICY: [
    { key: 'RED_RULES', label: '红线制度 / Regles rouges' },
    { key: 'BLACK_RULES', label: '黑线制度 / Regles noires' },
  ],
  MANAGEMENT: [
    { key: 'SALLE_TOOLS', label: '外场管理工具 / Outil de gestion de Salle' },
    { key: 'CUISINE_TOOLS', label: '厨房管理工具 / Outil de gestion de Cuisine' },
  ],
  FORMS: [
    { key: 'MEAT_DATE_FORM', label: '肉类日期记录表格 / Date de production de viande' },
    { key: 'CLEANING_FORM', label: '大扫除表格 / Tableau de menage' },
  ],
};
