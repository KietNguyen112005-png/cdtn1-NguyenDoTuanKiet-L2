// BR5: vòng đời trạng thái của phiếu (khớp bảng thuật ngữ SRS mục 1.5).
const STATUSES = ['MOI', 'DA_PHAN_CONG', 'DANG_XU_LY', 'CHO_LINH_KIEN', 'HOAN_TAT', 'DA_DONG', 'DA_HUY'];

const TRANSITIONS = {
  MOI: ['DA_PHAN_CONG', 'DA_HUY'],
  DA_PHAN_CONG: ['DANG_XU_LY', 'DA_HUY'],
  DANG_XU_LY: ['CHO_LINH_KIEN', 'HOAN_TAT'],
  CHO_LINH_KIEN: ['HOAN_TAT'],
  HOAN_TAT: ['DA_DONG'],
  DA_DONG: [],
  DA_HUY: [],
};

const canTransition = (from, to) => (TRANSITIONS[from] || []).includes(to);
const isClosing = (status) => status === 'DA_DONG' || status === 'DA_HUY';

module.exports = { STATUSES, TRANSITIONS, canTransition, isClosing };
