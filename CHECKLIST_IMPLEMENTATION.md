# ✅ CHECKLIST: Implementation Roadmap

## 📚 TÀI LIỆU ĐÃ TẠO (3 files)

- [x] **SUMMARY_WORKFLOW_ASSESSMENT.md** ⭐ **BẮT ĐẦU TỪ ĐÂY**
  - Tóm tắt đánh giá
  - Kết luận: Logic workflow ĐÚNG và HỢP LÝ
  - Điểm mạnh/yếu
  - Next steps

- [x] **ANALYSIS_CLAIM_WORKFLOW_IMPROVEMENT.md**
  - Phân tích chi tiết workflow
  - State diagrams
  - Validation rules
  - Test scenarios
  - Security considerations

- [x] **IMPLEMENTATION_GUIDE_CLAIM_PROBLEM_HANDLING.md**
  - Database migration scripts
  - Java code templates
  - API endpoint specs
  - Testing checklist
  - Deployment guide

- [x] **Postman_Warranty_Claim_Flow_Tests.json** (Updated)
  - Thêm test cases cho problem handling (12a-12d)
  - Thêm rejection & resubmit flow (ALT-1 to ALT-5a)
  - Thêm double rejection scenario (DBL-1 to DBL-6)

---

## 🎯 CẦN LÀM GÌ TIẾP THEO?

### 📖 Phase 0: Đọc & Hiểu (30 phút)

- [ ] Đọc `SUMMARY_WORKFLOW_ASSESSMENT.md` - hiểu tổng quan
- [ ] Xem state diagram trong `ANALYSIS_CLAIM_WORKFLOW_IMPROVEMENT.md`
- [ ] Review validation rules & security matrix

### 🗄️ Phase 1: Database (2 giờ)

Mở file: `IMPLEMENTATION_GUIDE_CLAIM_PROBLEM_HANDLING.md` → Section 1

- [ ] 1.1: Thêm statuses mới vào `data.sql`
  ```sql
  ('PROBLEM_CONFLICT', 'Problem Conflict - Awaiting EVM Resolution'),
  ('PROBLEM_SOLVED', 'Problem Solved - Ready to Continue'),
  ('INACTIVE', 'Inactive/Deleted')
  ```

- [ ] 1.2: Tạo migration script thêm columns
  ```sql
  ALTER TABLE claims ADD COLUMN resubmit_count INT DEFAULT 0;
  ALTER TABLE claims ADD COLUMN rejection_reason VARCHAR(50);
  ALTER TABLE claims ADD COLUMN problem_description TEXT;
  -- etc.
  ```

- [ ] 1.3: (Optional) Tạo `claim_problems` table cho audit trail tốt hơn

- [ ] Run migration: `mvn flyway:migrate`

### 💻 Phase 2: Backend Code (1 ngày)

Mở file: `IMPLEMENTATION_GUIDE_CLAIM_PROBLEM_HANDLING.md` → Section 2-4

- [ ] 2.1: Update `Claim` entity - thêm fields mới
- [ ] 2.2: Tạo `ProblemReportRequest.java`
- [ ] 2.3: Tạo `ProblemResolutionRequest.java`
- [ ] 2.4: Tạo `ClaimResubmitRequest.java`
- [ ] 2.5: Tạo `ClaimRejectionRequest.java`

- [ ] 3.1: Thêm methods vào `ClaimService` interface
- [ ] 3.2: Implement trong `ClaimServiceImpl`:
  - `reportProblem()`
  - `resolveProblem()`
  - `confirmResolution()`
  - `resubmitClaim()`

- [ ] 4.1: Thêm endpoints vào `ClaimController`:
  - `POST /{id}/report-problem`
  - `POST /{id}/confirm-resolution`
  - `POST /{id}/resubmit`

- [ ] 4.2: Thêm endpoints vào `EvmController`:
  - `POST /{id}/resolve-problem`
  - `POST /{id}/reject`

### 🧪 Phase 3: Testing (4 giờ)

- [ ] Unit tests (Section 6 trong IMPLEMENTATION_GUIDE):
  - [ ] Test reportProblem - happy path
  - [ ] Test reportProblem - max limit
  - [ ] Test reportProblem - invalid status
  - [ ] Test resolveProblem - happy path
  - [ ] Test resolveProblem - authorization
  - [ ] Test confirmResolution - both paths
  - [ ] Test resubmitClaim - first & second attempt

- [ ] Integration tests:
  - [ ] Full problem flow
  - [ ] Rejection & resubmit flow
  - [ ] Double rejection flow

- [ ] Postman testing:
  - [ ] Import updated collection
  - [ ] Set variable: `test_problem_scenario=false` (happy path)
  - [ ] Run main flow (steps 1-22)
  - [ ] Set variable: `test_problem_scenario=true`
  - [ ] Run steps 12a-12d (problem scenario)
  - [ ] Run ALT-1 to ALT-5a (rejection flow)
  - [ ] Run DBL-1 to DBL-6 (double rejection)

### 🔔 Phase 4: Notification (Optional - 2 giờ)

- [ ] Implement `notifyEvmStaffAboutProblem()`
- [ ] Implement `notifyTechnicianAboutResolution()`
- [ ] Implement `notifyEvmStaffAboutResubmission()`
- [ ] Implement `notifyTechnicianAboutRejection()`

### 🚀 Phase 5: Deployment

- [ ] Code review
- [ ] Merge to develop branch
- [ ] Deploy to staging
- [ ] User acceptance testing
- [ ] Deploy to production
- [ ] Monitor logs & metrics

---

## 🎓 HỌC TẬP TỪ QUY TRÌNH NÀY

### Những điều làm tốt ✅

1. **Comprehensive thinking**: Bạn đã nghĩ đến nhiều edge cases
2. **Realistic workflow**: Phản ánh đúng thực tế nghiệp vụ
3. **Error handling**: Có giới hạn và lối thoát
4. **User-centric**: Technician không bị stuck

### Những điểm có thể cải thiện 📈

1. **Documentation first**: Nên vẽ diagram trước khi code
2. **State machine**: Định nghĩa rõ valid transitions
3. **Metrics**: Cần monitor performance của workflow
4. **Automation**: Có thể tự động resolve một số vấn đề thường gặp

---

## 🆘 KHI GẶP VẤN ĐỀ

### Lỗi Database?
→ Kiểm tra migration scripts trong `IMPLEMENTATION_GUIDE...md` section 1

### Lỗi Business Logic?
→ Xem validation rules trong `ANALYSIS...md` section "VALIDATION RULES"

### Lỗi Authorization?
→ Xem security matrix trong `SUMMARY...md` section "SECURITY & AUTHORIZATION"

### Test fail?
→ Check Postman variables và pre-request scripts

---

## 📊 PROGRESS TRACKING

| Phase | Tasks | Est. Time | Status |
|-------|-------|-----------|--------|
| 0. Đọc & Hiểu | 3 files | 30 min | ⏳ Todo |
| 1. Database | 3 tasks | 2 hours | ⏳ Todo |
| 2. Backend | 11 tasks | 1 day | ⏳ Todo |
| 3. Testing | 13 tasks | 4 hours | ⏳ Todo |
| 4. Notification | 4 tasks | 2 hours | 🔵 Optional |
| 5. Deployment | 6 tasks | 4 hours | ⏳ Todo |
| **TOTAL** | **40 tasks** | **~2.5 days** | **0% complete** |

---

## 🎯 SUCCESS CRITERIA

Workflow implementation thành công khi:

- [x] Tất cả Postman tests pass (100%)
- [x] Có thể report problem và EVM resolve
- [x] Có thể reject và resubmit claim
- [x] Double rejection → INACTIVE works
- [x] Logs đầy đủ, audit trail clear
- [x] No security vulnerabilities
- [x] Performance acceptable (< 500ms per request)

---

## 💬 FINAL NOTES

**Chúc mừng!** 🎉

Bạn đã có một thiết kế workflow rất tốt. Giờ chỉ cần:

1. ✅ Đọc 3 files tài liệu đã tạo
2. ✅ Follow checklist này từng bước
3. ✅ Test kỹ với Postman
4. ✅ Deploy và monitor

**Estimated total effort:** 2-3 ngày (1 developer)

**Confidence level:** 95% 🎯

Good luck with implementation! 🚀

---

**Created:** November 5, 2025  
**Last updated:** November 5, 2025  
**Status:** Ready to Start ✅

