// Kiểu dữ liệu dùng chung giữa server và web.

export type Gender = 'male' | 'female' | 'unknown';
export type ChildKind = 'biological' | 'adopted';
export type UnionStatus = 'married' | 'divorced' | 'widowed';

/** Ngày không đầy đủ: gia phả hay chỉ biết năm, hoặc chỉ ngày-tháng (âm lịch) của ngày giỗ. */
export interface PartialDate {
  year?: number;
  month?: number;
  day?: number;
  lunar?: boolean;
}

/** Trường quản trị được ẩn/hiện. Họ tên, giới tính, đời, còn sống/đã mất và quan hệ LUÔN hiện. */
export const HIDEABLE_FIELDS = [
  'otherNames',
  'birthDate',
  'birthPlace',
  'deathDate',
  'notes',
  'contact',
  'photo',
] as const;
export type HideableField = (typeof HIDEABLE_FIELDS)[number];

/** Đối tượng xem được cấu hình. Quản trị luôn thấy tất cả nên không có trong cấu hình. */
export const AUDIENCES = ['guest', 'member'] as const;
export type Audience = (typeof AUDIENCES)[number];
export const SUBJECTS = ['living', 'deceased'] as const;
export type Subject = (typeof SUBJECTS)[number];
export type ViewerRole = Audience | 'admin';

export interface PersonView {
  id: number;
  fullName: string;
  gender: Gender;
  isLiving: boolean;
  /** Đời thứ mấy tính từ thuỷ tổ (1 = thuỷ tổ); null nếu không nối được vào cây. */
  generation: number | null;
  otherNames?: string | null;
  birthDate?: PartialDate | null;
  birthPlace?: string | null;
  deathDate?: PartialDate | null;
  notes?: string | null;
  contact?: string | null;
  photo?: string | null;
  /** true khi quản trị đánh dấu người này ẩn toàn bộ chi tiết với người đang xem. */
  detailsHidden?: boolean;
}

export interface TreeUnion {
  unionId: number;
  /** null = cha/mẹ đơn thân (union chỉ có 1 người). */
  spouseId: number | null;
  /** Thứ tự hôn nhân (1 = vợ/chồng cả). */
  order: number;
  children: TreeNode[];
}

export interface TreeNode {
  personId: number;
  childKind?: ChildKind;
  /** true = người này đã được vẽ đầy đủ ở chỗ khác trong cây (vd con nuôi có cả cha mẹ ruột trong
   *  dòng họ) — ô này chỉ là tham chiếu, không bung con cháu lần nữa. */
  ref?: boolean;
  unions: TreeUnion[];
}

export interface TreeResponse {
  roots: TreeNode[];
  persons: Record<number, PersonView>;
}

export interface PersonDetail {
  person: PersonView;
  parents: number[];
  spouses: { personId: number; unionId: number; order: number }[];
  children: { personId: number; kind: ChildKind }[];
}

export interface SearchHit {
  id: number;
  fullName: string;
  generation: number | null;
}
