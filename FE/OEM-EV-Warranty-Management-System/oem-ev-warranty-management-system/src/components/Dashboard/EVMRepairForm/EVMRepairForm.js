import React, { useState, useEffect } from 'react';
import WarrantyCheckComponent from '../../WarrantyCheck/WarrantyCheckComponent';
import './EVMRepairForm.css';

const EVMRepairForm = ({
    vehicleId,
    onSubmit,
    initialData = {},
    className = ''
}) => {
    const [warrantyResult, setWarrantyResult] = useState(null);
    const [isFormCollapsed, setIsFormCollapsed] = useState(false);
    const [manualOverride, setManualOverride] = useState(false);
    const [confirmationChecked, setConfirmationChecked] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        issueDescription: initialData.issueDescription || '',
        repairDetails: initialData.repairDetails || '',
        partsUsed: initialData.partsUsed || '',
        laborCost: initialData.laborCost || '',
        partsCost: initialData.partsCost || '',
        totalCost: initialData.totalCost || '',
        repairDate: initialData.repairDate || new Date().toISOString().split('T')[0],
        estimatedRepairTime: initialData.estimatedRepairTime || '',
        priorityLevel: initialData.priorityLevel || 'medium',
        ...initialData
    });

    // Calculate total cost automatically
    useEffect(() => {
        const laborCost = parseFloat(formData.laborCost) || 0;
        const partsCost = parseFloat(formData.partsCost) || 0;
        const total = laborCost + partsCost;

        setFormData(prev => ({
            ...prev,
            totalCost: total.toFixed(2)
        }));
    }, [formData.laborCost, formData.partsCost]);

    const handleWarrantyCheckComplete = (result) => {
        setWarrantyResult(result);
        if (result && !result.error && !result.isEligible) {
            setIsFormCollapsed(true);
            setManualOverride(false);
            setConfirmationChecked(false);
        } else if (result && result.error) {
            // Handle API error - allow form usage but with warning
            setIsFormCollapsed(false);
        }
    };

    const handleManualOverrideToggle = () => {
        setManualOverride(!manualOverride);
        setConfirmationChecked(false);
        if (!manualOverride) {
            setIsFormCollapsed(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const isFormDisabled = warrantyResult &&
        !warrantyResult.error &&
        !warrantyResult.isEligible &&
        !manualOverride;

    const canSubmit = warrantyResult &&
        !isSubmitting &&
        (warrantyResult.error ||
            warrantyResult.isEligible ||
            (manualOverride && confirmationChecked)) &&
        formData.issueDescription.trim() &&
        formData.repairDetails.trim();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!canSubmit) return;

        setIsSubmitting(true);

        try {
            const submitData = {
                ...formData,
                vehicleId,
                warrantyCheckResult: warrantyResult,
                manualOverride,
                confirmationChecked,
                submittedAt: new Date().toISOString()
            };

            await onSubmit(submitData);
        } catch (error) {
            console.error('Error submitting repair form:', error);
            alert('Có lỗi xảy ra khi gửi yêu cầu. Vui lòng thử lại.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className={`evm-repair-form ${className}`}>
            {/* Warranty Check Section */}
            <div className="warranty-check-section">
                <h3>Kiểm tra điều kiện bảo hành</h3>
                <WarrantyCheckComponent
                    vehicleId={vehicleId}
                    onCheckComplete={handleWarrantyCheckComplete}
                />
            </div>

            {/* Repair Form */}
            <div className={`repair-form-section ${isFormDisabled ? 'disabled' : ''}`}>
                <div className="form-header">
                    <h3>Thông tin sửa chữa</h3>
                    {warrantyResult && !warrantyResult.error && !warrantyResult.isEligible && (
                        <button
                            type="button"
                            className="btn btn--secondary btn--sm"
                            onClick={() => setIsFormCollapsed(!isFormCollapsed)}
                        >
                            {isFormCollapsed ? 'Mở rộng form' : 'Thu gọn form'}
                        </button>
                    )}
                </div>

                <form
                    onSubmit={handleSubmit}
                    className={`repair-form ${isFormCollapsed ? 'collapsed' : ''}`}
                >
                    <div className="form-group">
                        <label htmlFor="issueDescription">Mô tả vấn đề *</label>
                        <textarea
                            id="issueDescription"
                            name="issueDescription"
                            value={formData.issueDescription}
                            onChange={handleInputChange}
                            disabled={isFormDisabled}
                            required
                            rows="4"
                            placeholder="Mô tả chi tiết vấn đề cần sửa chữa..."
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="repairDetails">Chi tiết sửa chữa *</label>
                        <textarea
                            id="repairDetails"
                            name="repairDetails"
                            value={formData.repairDetails}
                            onChange={handleInputChange}
                            disabled={isFormDisabled}
                            required
                            rows="4"
                            placeholder="Mô tả các bước sửa chữa thực hiện..."
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="partsUsed">Linh kiện sử dụng</label>
                        <textarea
                            id="partsUsed"
                            name="partsUsed"
                            value={formData.partsUsed}
                            onChange={handleInputChange}
                            disabled={isFormDisabled}
                            rows="3"
                            placeholder="Danh sách linh kiện được sử dụng..."
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="laborCost">Chi phí nhân công (VNĐ)</label>
                            <input
                                type="number"
                                id="laborCost"
                                name="laborCost"
                                value={formData.laborCost}
                                onChange={handleInputChange}
                                disabled={isFormDisabled}
                                min="0"
                                step="1000"
                                placeholder="0"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="partsCost">Chi phí linh kiện (VNĐ)</label>
                            <input
                                type="number"
                                id="partsCost"
                                name="partsCost"
                                value={formData.partsCost}
                                onChange={handleInputChange}
                                disabled={isFormDisabled}
                                min="0"
                                step="1000"
                                placeholder="0"
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="totalCost">Tổng chi phí (VNĐ)</label>
                            <input
                                type="number"
                                id="totalCost"
                                name="totalCost"
                                value={formData.totalCost}
                                onChange={handleInputChange}
                                disabled={true}
                                className="calculated-field"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="priorityLevel">Mức độ ưu tiên</label>
                            <select
                                id="priorityLevel"
                                name="priorityLevel"
                                value={formData.priorityLevel}
                                onChange={handleInputChange}
                                disabled={isFormDisabled}
                            >
                                <option value="low">Thấp</option>
                                <option value="medium">Trung bình</option>
                                <option value="high">Cao</option>
                                <option value="urgent">Khẩn cấp</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="repairDate">Ngày sửa chữa</label>
                            <input
                                type="date"
                                id="repairDate"
                                name="repairDate"
                                value={formData.repairDate}
                                onChange={handleInputChange}
                                disabled={isFormDisabled}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="estimatedRepairTime">Thời gian sửa chữa dự kiến (giờ)</label>
                            <input
                                type="number"
                                id="estimatedRepairTime"
                                name="estimatedRepairTime"
                                value={formData.estimatedRepairTime}
                                onChange={handleInputChange}
                                disabled={isFormDisabled}
                                min="0.5"
                                step="0.5"
                                placeholder="VD: 2.5"
                            />
                        </div>
                    </div>

                    {/* Manual Override Section */}
                    {warrantyResult && !warrantyResult.error && !warrantyResult.isEligible && (
                        <div className="manual-override-section">
                            <div className="form-group">
                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={manualOverride}
                                        onChange={handleManualOverrideToggle}
                                    />
                                    <span className="checkmark"></span>
                                    Nhập thông tin thủ công (bỏ qua kiểm tra tự động)
                                </label>
                            </div>

                            {manualOverride && (
                                <div className="form-group confirmation-group">
                                    <label className="checkbox-label warning">
                                        <input
                                            type="checkbox"
                                            checked={confirmationChecked}
                                            onChange={(e) => setConfirmationChecked(e.target.checked)}
                                            required
                                        />
                                        <span className="checkmark"></span>
                                        <span className="confirmation-text">
                                            Bạn có chắc chắn những thông tin trên xe đáp ứng đầy đủ các điều kiện bảo hành
                                            của hãng đối với mẫu xe cho tới thời điểm hiện tại và đồng ý lưu thông tin?
                                        </span>
                                    </label>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="form-actions">
                        <button
                            type="submit"
                            className={`btn btn--primary ${!canSubmit ? 'disabled' : ''}`}
                            disabled={!canSubmit}
                        >
                            {isSubmitting ? 'Đang gửi...' : 'Gửi yêu cầu sửa chữa'}
                        </button>
                        <button
                            type="button"
                            className="btn btn--secondary"
                            onClick={() => window.history.back()}
                        >
                            Hủy bỏ
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EVMRepairForm;