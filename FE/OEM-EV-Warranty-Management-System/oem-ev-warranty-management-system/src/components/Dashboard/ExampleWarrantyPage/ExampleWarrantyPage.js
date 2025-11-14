import React, { useState, useEffect } from 'react';
import { EVMRepairForm } from '../EVMRepairForm';
import { EVMClaimTable } from '../EVMClaimTable';
import { WarrantyCheckComponent } from '../../WarrantyCheck';

// Example page showing how to use the new warranty check components
const ExampleWarrantyPage = () => {
    const [selectedVehicleId, setSelectedVehicleId] = useState('');
    const [claims, setClaims] = useState([]);

    // Mock data for demonstration
    const mockClaims = [
        {
            id: 'CLM001',
            vehicleId: 'VEH001',
            vehicleModel: 'Tesla Model Y',
            technician: 'Nguyễn Văn A',
            submittedDate: '2024-11-10T10:00:00.000Z',
            status: 'submitted_for_approval',
            claimNumber: 'CLM-2024-001'
        },
        {
            id: 'CLM002',
            vehicleId: 'VEH002',
            vehicleModel: 'VinFast VF8',
            technician: 'Trần Thị B',
            submittedDate: '2024-11-11T14:30:00.000Z',
            status: 'submitted_for_approval',
            claimNumber: 'CLM-2024-002'
        },
        {
            id: 'CLM003',
            vehicleId: 'VEH003',
            vehicleModel: 'BMW iX3',
            technician: 'Lê Văn C',
            submittedDate: '2024-11-12T09:15:00.000Z',
            status: 'approved',
            claimNumber: 'CLM-2024-003'
        }
    ];

    useEffect(() => {
        // Simulate API call to fetch claims
        setClaims(mockClaims);
    }, []);

    const handleRepairFormSubmit = async (formData) => {
        try {
            console.log('Submitting repair form:', formData);

            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));

            alert('Yêu cầu sửa chữa đã được gửi thành công!');

            // Reset form or redirect
            setSelectedVehicleId('');

        } catch (error) {
            console.error('Error submitting repair form:', error);
            alert('Có lỗi xảy ra khi gửi yêu cầu. Vui lòng thử lại.');
        }
    };

    const handleClaimAction = (claim, action) => {
        console.log('Claim action:', action, 'for claim:', claim);

        switch (action) {
            case 'view':
                alert(`Xem chi tiết claim ${claim.id}`);
                break;
            case 'approve':
                if (confirm(`Bạn có chắc chắn muốn phê duyệt claim ${claim.id}?`)) {
                    // Update claim status
                    setClaims(prev => prev.map(c =>
                        c.id === claim.id ? { ...c, status: 'approved' } : c
                    ));
                    alert('Claim đã được phê duyệt!');
                }
                break;
            case 'reject':
                if (confirm(`Bạn có chắc chắn muốn từ chối claim ${claim.id}?`)) {
                    // Update claim status
                    setClaims(prev => prev.map(c =>
                        c.id === claim.id ? { ...c, status: 'rejected' } : c
                    ));
                    alert('Claim đã bị từ chối!');
                }
                break;
            default:
                break;
        }
    };

    return (
        <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
            <h1>Demo Tính năng Kiểm tra Bảo hành</h1>

            {/* Section 1: Standalone Warranty Check */}
            <div style={{ marginBottom: '40px' }}>
                <h2>1. Kiểm tra bảo hành độc lập</h2>
                <div style={{ marginBottom: '20px' }}>
                    <label htmlFor="vehicleSelect">Chọn xe để kiểm tra:</label>
                    <select
                        id="vehicleSelect"
                        value={selectedVehicleId}
                        onChange={(e) => setSelectedVehicleId(e.target.value)}
                        style={{
                            marginLeft: '10px',
                            padding: '8px',
                            borderRadius: '4px',
                            border: '1px solid #ccc'
                        }}
                    >
                        <option value="">-- Chọn xe --</option>
                        <option value="VEH001">Tesla Model Y - VEH001</option>
                        <option value="VEH002">VinFast VF8 - VEH002</option>
                        <option value="VEH003">BMW iX3 - VEH003</option>
                    </select>
                </div>

                {selectedVehicleId && (
                    <WarrantyCheckComponent
                        vehicleId={selectedVehicleId}
                        onCheckComplete={(result) => {
                            console.log('Warranty check result:', result);
                        }}
                    />
                )}
            </div>

            {/* Section 2: Repair Form with Warranty Check */}
            <div style={{ marginBottom: '40px' }}>
                <h2>2. Form sửa chữa với kiểm tra bảo hành tích hợp</h2>
                {selectedVehicleId ? (
                    <EVMRepairForm
                        vehicleId={selectedVehicleId}
                        onSubmit={handleRepairFormSubmit}
                    />
                ) : (
                    <p style={{
                        color: '#6c757d',
                        fontStyle: 'italic',
                        padding: '20px',
                        background: '#f8f9fa',
                        borderRadius: '8px',
                        textAlign: 'center'
                    }}>
                        Vui lòng chọn xe ở phần trên để hiển thị form sửa chữa
                    </p>
                )}
            </div>

            {/* Section 3: Claims Management Table */}
            <div style={{ marginBottom: '40px' }}>
                <h2>3. Bảng quản lý yêu cầu với kiểm tra bảo hành tự động</h2>
                <EVMClaimTable
                    claims={claims}
                    onClaimSelect={handleClaimAction}
                    loading={false}
                />
            </div>

            {/* Instructions */}
            <div style={{
                background: '#e8f4f8',
                padding: '20px',
                borderRadius: '8px',
                marginTop: '40px'
            }}>
                <h3>Hướng dẫn sử dụng:</h3>
                <ol>
                    <li><strong>Kiểm tra bảo hành:</strong> Chọn xe từ dropdown để xem component kiểm tra bảo hành hoạt động</li>
                    <li><strong>Form sửa chữa:</strong> Sau khi chọn xe, form sửa chữa sẽ tự động kiểm tra điều kiện bảo hành và điều chỉnh giao diện phù hợp</li>
                    <li><strong>Bảng quản lý:</strong> Xem các claim có trạng thái "Chờ phê duyệt" sẽ tự động kiểm tra bảo hành</li>
                    <li><strong>Tương tác:</strong> Thử approve/reject claims để xem thay đổi trạng thái</li>
                </ol>

                <h4>Lưu ý:</h4>
                <ul>
                    <li>Đây là demo với mock data, trong production cần kết nối với API thật</li>
                    <li>Component có thể tùy chỉnh styling thông qua CSS classes</li>
                    <li>Tất cả component đều responsive và có error handling</li>
                </ul>
            </div>
        </div>
    );
};

export default ExampleWarrantyPage;