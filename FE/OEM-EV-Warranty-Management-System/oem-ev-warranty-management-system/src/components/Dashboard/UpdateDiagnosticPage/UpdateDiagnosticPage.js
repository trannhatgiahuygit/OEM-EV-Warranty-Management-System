// UpdateDiagnosticPage.js

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import { FaPlus, FaTrash, FaSave, FaExclamationTriangle, FaTimesCircle, FaUpload, FaFileAlt } from 'react-icons/fa'; 
import './UpdateDiagnosticPage.css'; 

// Initial state for a new required part, now with search/query fields
const initialPart = {
  partId: '',
  partName: '',
  quantity: 1,
  searchQuery: '',
  searchResults: [],
  showResults: false,
};

const UpdateDiagnosticPage = ({ handleBackClick, claimId }) => {
  const [claim, setClaim] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Remaining States
  const [diagnosticDetails, setDiagnosticDetails] = useState(''); 
  const [estimatedRepairCost, setEstimatedRepairCost] = useState(''); // This state is used for the input field value
  const [requiredParts, setRequiredParts] = useState([initialPart]);
  
  // ===== NEW: Repair type and warranty eligibility states =====
  const [repairType, setRepairType] = useState('EVM_REPAIR'); // EVM_REPAIR or SC_REPAIR
  const [warrantyEligibilityAssessment, setWarrantyEligibilityAssessment] = useState('');
  const [isWarrantyEligible, setIsWarrantyEligible] = useState(null);
  const [warrantyEligibilityNotes, setWarrantyEligibilityNotes] = useState('');
  
  // ===== NEW: Automatic warranty checker states =====
  const [warrantyCheckResult, setWarrantyCheckResult] = useState(null); // 'pass', 'fail', 'no_constraints', 'checking'
  const [warrantyCheckReasons, setWarrantyCheckReasons] = useState([]); // Array of reason strings
  const [warrantyConditions, setWarrantyConditions] = useState([]); // Fetched warranty conditions
  const [showCustomerActionPrompt, setShowCustomerActionPrompt] = useState(false);
  const [customerActionDescription, setCustomerActionDescription] = useState('');
  const [warrantyOverrideConfirmed, setWarrantyOverrideConfirmed] = useState(false); // Checkbox for override warranty check
  
  // ===== NEW: Service catalog states =====
  const [serviceCatalogItems, setServiceCatalogItems] = useState([]);
  const [serviceItems, setServiceItems] = useState([]); // Available service items from API
  const [totalServiceCost, setTotalServiceCost] = useState(0);
  const [serviceSearchQuery, setServiceSearchQuery] = useState('');
  const [serviceSearchResults, setServiceSearchResults] = useState([]);
  const [showServiceSearchResults, setShowServiceSearchResults] = useState(false);
  const [serviceSearchLoading, setServiceSearchLoading] = useState(false);
  
  // ===== NEW: Third party parts states (for SC Repair) =====
  const [thirdPartyParts, setThirdPartyParts] = useState([]);
  const [availableThirdPartyParts, setAvailableThirdPartyParts] = useState([]);
  const [thirdPartyPartSearchQuery, setThirdPartyPartSearchQuery] = useState('');
  const [thirdPartyPartSearchResults, setThirdPartyPartSearchResults] = useState([]);
  const [showThirdPartyPartSearchResults, setShowThirdPartyPartSearchResults] = useState(false);
  const [thirdPartyPartSearchLoading, setThirdPartyPartSearchLoading] = useState(false);
  const [partSerialStatus, setPartSerialStatus] = useState({}); // Store status messages for each part
  
  // --- NEW: Added States for Comprehensive Payload ---
  const [diagnosticSummary, setDiagnosticSummary] = useState(''); 
  // REMOVED: diagnosticData state
  const [testResults, setTestResults] = useState('');
  const [repairNotes, setRepairNotes] = useState('');
  const [laborHours, setLaborHours] = useState('');
  const [initialDiagnosis, setInitialDiagnosis] = useState(''); 
  // REMOVED: estimatedRepairTime state
  const [readyForSubmission, setReadyForSubmission] = useState(false);
  const [reportedFailure, setReportedFailure] = useState(''); // Reported failure description
  // --- END NEW States ---
  
  // --- MODIFIED: File/Attachment States ---
  const [uploadingFiles, setUploadingFiles] = useState([]); 
  const [existingAttachments, setExistingAttachments] = useState([]); 
  const fileInputRef = useRef(null);
  // --- END MODIFIED File/Attachment States ---
  
  const [allPartSerials, setAllPartSerials] = useState([]);
  const [partDataLoading, setPartDataLoading] = useState(false);

  const effectRan = useRef(false);

  // --- Data Fetching: Claim Details & Part Serials ---
  useEffect(() => {
    if (effectRan.current || !claimId) return;
    effectRan.current = true;

    const user = JSON.parse(localStorage.getItem('user'));
    const token = user.token;

    const fetchAllData = async () => {
      setLoading(true);
      
      // 1. Fetch Part Serials
      setPartDataLoading(true);
      try {
        const partResponse = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/part-serials`,
          { headers: { 'Authorization': `Bearer ${token}` } }
        );
        if (partResponse.status === 200) {
          setAllPartSerials(partResponse.data);
        }
      } catch (err) {
        toast.error('Không thể tải danh mục phụ tùng để tìm kiếm.');
      } finally {
        setPartDataLoading(false);
      }
      
      // ===== NEW: Fetch service items from catalog (initial load) =====
      // Note: We'll load search results dynamically via API calls
      // Initial load is not needed for search functionality
      
      // Note: Third-party parts are now loaded dynamically via API search, not pre-loaded
      
      // 2. Fetch Claim Details
      try {
        const claimResponse = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/claims/${claimId}`,
          { headers: { 'Authorization': `Bearer ${token}` } }
        );

        if (claimResponse.status === 200) {
          const claimData = claimResponse.data;
          setClaim(claimData);

          // Pre-populate fields
          // Note: diagnosticSummary and initialDiagnosis are intentionally empty on load as per previous request
          setDiagnosticSummary(claimData.diagnosticSummary || ''); 
          setInitialDiagnosis(claimData.initialDiagnosis || ''); 
          
          setDiagnosticDetails(claimData.diagnosticDetails || ''); 
          setEstimatedRepairCost(claimData.estimatedRepairCost || ''); 
          // REMOVED: setEstimatedRepairTime(claimData.estimatedRepairTime || ''); 
          // REMOVED: setDiagnosticData(claimData.diagnosticData || '');
          setTestResults(claimData.testResults || '');
          setRepairNotes(claimData.repairNotes || '');
          setLaborHours(claimData.laborHours || '');
          setReadyForSubmission(claimData.readyForSubmission || false);
          setReportedFailure(claimData.reportedFailure || ''); // Load reported failure from claim
          
          // ===== NEW: Load repair type and warranty eligibility =====
          // Check if claim has been denied twice and is reopened - force SC_REPAIR
          const isDoubleRejectedAndReopened = 
            claimData.status === 'OPEN' && 
            ((claimData.rejectionCount !== null && claimData.rejectionCount !== undefined && claimData.rejectionCount >= 2) ||
             (claimData.canResubmit === false && claimData.resubmitCount !== null && claimData.resubmitCount !== undefined && claimData.resubmitCount >= 1));
          
          if (isDoubleRejectedAndReopened) {
            // Force SC_REPAIR for double-rejected and reopened claims
            setRepairType('SC_REPAIR');
          } else {
            setRepairType(claimData.repairType || 'EVM_REPAIR');
          }
          
          setWarrantyEligibilityAssessment(claimData.warrantyEligibilityAssessment || '');
          setIsWarrantyEligible(claimData.isWarrantyEligible);
          setWarrantyEligibilityNotes(claimData.warrantyEligibilityNotes || '');
          const existingServiceItems = claimData.serviceCatalogItems || [];
          setServiceCatalogItems(existingServiceItems);
          setTotalServiceCost(claimData.totalServiceCost || 0);
          
          // Calculate labor hours from existing service items
          if (existingServiceItems.length > 0) {
            const totalLaborHours = existingServiceItems.reduce((sum, item) => 
              sum + (parseFloat(item.standardLaborHours || 0) * parseInt(item.quantity || 1)), 0
            );
            setLaborHours(totalLaborHours.toFixed(1));
          }
          
          const existingParts = claimData.requiredParts?.length > 0 
              ? claimData.requiredParts.map(p => ({
                  ...initialPart,
                  partId: String(p.partId), 
                  partName: p.partName,
                  quantity: p.quantity,
                  searchQuery: p.partName, 
                })) 
              : [initialPart];
              
          setRequiredParts(existingParts);
          
          // Populate existing attachments
          setExistingAttachments(claimData.attachments || []);
          
          // ===== NEW: Trigger automatic warranty check if EVM_REPAIR =====
          if (claimData.repairType === 'EVM_REPAIR' || !claimData.repairType) {
            // Will be checked in separate useEffect
          }
        }
      } catch (err) {
        toast.error('Không thể tải dữ liệu yêu cầu.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [claimId]);
  
  // ===== NEW: Automatic Warranty Checker Effect =====
  useEffect(() => {
    if (!claim || repairType !== 'EVM_REPAIR') {
      setWarrantyCheckResult(null);
      return;
    }
    
    const performWarrantyCheck = async () => {
      setWarrantyCheckResult('checking');
      setWarrantyCheckReasons([]);
      
      try {
        const user = JSON.parse(localStorage.getItem('user'));
        const token = user?.token;
        
        if (!token) {
          console.error('No token available for warranty check');
          return;
        }
        
        // Get vehicle model ID from claim - try multiple possible locations
        let vehicleModelId = claim?.vehicle?.vehicleModelId || 
                            claim?.vehicle?.vehicleModel?.id ||
                            claim?.vehicle?.modelId ||
                            claim?.vehicleModelId;
        
        // Get vehicle model name - handle both string and object cases
        let vehicleModelName = claim?.vehicle?.vehicleModel?.name || 
                             claim?.vehicle?.vehicleModelName || 
                             claim?.vehicle?.model?.name ||
                             claim?.vehicle?.modelName ||
                             (typeof claim?.vehicle?.model === 'string' ? claim?.vehicle?.model : null) ||
                             'N/A';
        const vehicleVin = claim?.vehicle?.vin || 'N/A';
        const vehicleId = claim?.vehicle?.id || claim?.vehicleId;
        
        // Debug: Log full vehicle structure
        console.log('=== Warranty Check Debug ===');
        console.log('Full claim object:', claim);
        console.log('Claim vehicle:', claim?.vehicle);
        console.log('Vehicle VIN:', vehicleVin);
        console.log('Vehicle ID:', vehicleId);
        console.log('Vehicle Model Name:', vehicleModelName);
        console.log('VehicleModelId (direct):', claim?.vehicle?.vehicleModelId);
        console.log('VehicleModelId (from object):', claim?.vehicle?.vehicleModel?.id);
        console.log('VehicleModelId (modelId):', claim?.vehicle?.modelId);
        console.log('VehicleModelId (from claim root):', claim?.vehicleModelId);
        console.log('Final vehicleModelId:', vehicleModelId);
        
        // If vehicleModelId is still not found, try to fetch vehicle details
        if (!vehicleModelId && vehicleId) {
          console.log('VehicleModelId not found in claim, attempting to fetch vehicle details...');
          try {
            const vehicleResponse = await axios.get(
              `${process.env.REACT_APP_API_URL}/api/vehicles/${vehicleId}`,
              { headers: { 'Authorization': `Bearer ${token}` } }
            );
            
            if (vehicleResponse.status === 200 && vehicleResponse.data) {
              const vehicleData = vehicleResponse.data;
              console.log('Fetched vehicle data:', vehicleData);
              vehicleModelId = vehicleData.vehicleModelId || 
                              vehicleData.vehicleModel?.id ||
                              vehicleData.modelId;
              console.log('VehicleModelId from vehicle API:', vehicleModelId);
            }
          } catch (vehicleErr) {
            console.error('Error fetching vehicle details:', vehicleErr);
          }
        }
        
        // If still not found and we have model name, try to find by name
        if (!vehicleModelId && vehicleModelName && vehicleModelName !== 'N/A') {
          console.log('VehicleModelId still not found, attempting to find by model name:', vehicleModelName);
          try {
            // Fetch all active vehicle models
            const modelsResponse = await axios.get(
              `${process.env.REACT_APP_API_URL}/api/vehicle-models/active`,
              { headers: { 'Authorization': `Bearer ${token}` } }
            );
            
            if (modelsResponse.status === 200 && Array.isArray(modelsResponse.data)) {
              // Try to find model by exact name match first
              let foundModel = modelsResponse.data.find(model => 
                model.name && model.name.trim().toLowerCase() === vehicleModelName.trim().toLowerCase()
              );
              
              // If not found, try partial match
              if (!foundModel) {
                foundModel = modelsResponse.data.find(model => 
                  model.name && (
                    model.name.toLowerCase().includes(vehicleModelName.toLowerCase()) ||
                    vehicleModelName.toLowerCase().includes(model.name.toLowerCase())
                  )
                );
              }
              
              if (foundModel && foundModel.id) {
                vehicleModelId = foundModel.id;
                console.log('Found VehicleModelId by name match:', vehicleModelId, 'Model:', foundModel.name);
              } else {
                console.warn('No vehicle model found matching name:', vehicleModelName);
                console.warn('Available models:', modelsResponse.data.map(m => ({ id: m.id, name: m.name })));
              }
            }
          } catch (modelsErr) {
            console.error('Error fetching vehicle models:', modelsErr);
          }
        }
        
        if (!vehicleModelId) {
          // No vehicle model ID - treat as no constraints
          console.warn('=== NO VEHICLE MODEL ID FOUND ===');
          console.warn('Vehicle ID:', vehicleId);
          console.warn('Vehicle VIN:', vehicleVin);
          console.warn('Vehicle Model Name:', vehicleModelName);
          console.warn('Full vehicle object structure:', JSON.stringify(claim?.vehicle, null, 2));
          setWarrantyCheckResult('no_constraints');
          setWarrantyCheckReasons([
            'Không tìm thấy thông tin mẫu xe (Model ID) trong claim.',
            vehicleId ? `Vehicle ID: ${vehicleId}` : 'Vehicle ID không có trong claim.',
            vehicleModelName && vehicleModelName !== 'N/A' ? `Model Name: ${vehicleModelName}` : 'Model Name không có trong claim.',
            'Vui lòng kiểm tra lại thông tin xe trong hệ thống hoặc nhập thủ công điều kiện bảo hành.',
            'Lưu ý: Có thể cần cập nhật thông tin xe để bao gồm Model ID.'
          ]);
          return;
        }
        
        // Fetch effective warranty conditions for this model
        console.log('Fetching warranty conditions for modelId:', vehicleModelId, 'Model Name:', vehicleModelName);
        const conditionsResponse = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/warranty-conditions/effective`,
          {
            params: { modelId: vehicleModelId },
            headers: { 'Authorization': `Bearer ${token}` }
          }
        );
        
        console.log('Warranty conditions response:', conditionsResponse);
        console.log('Response status:', conditionsResponse.status);
        console.log('Response data:', conditionsResponse.data);
        
        if (conditionsResponse.status === 200) {
          const conditions = conditionsResponse.data || [];
          console.log('Fetched warranty conditions:', conditions);
          console.log('Number of conditions:', conditions.length);
          
          if (Array.isArray(conditions) && conditions.length > 0) {
            console.log('Conditions details:', conditions.map(c => ({
              id: c.id,
              vehicleModelId: c.vehicleModelId,
              vehicleModelName: c.vehicleModelName,
              effectiveFrom: c.effectiveFrom,
              effectiveTo: c.effectiveTo,
              active: c.active,
              coverageYears: c.coverageYears,
              coverageKm: c.coverageKm
            })));
          }
          
          setWarrantyConditions(conditions);
          
          if (conditions.length === 0) {
            // No warranty constraints found for this model
            console.warn('=== NO WARRANTY CONDITIONS FOUND ===');
            console.warn('Model ID:', vehicleModelId);
            console.warn('Model Name:', vehicleModelName);
            console.warn('Vehicle VIN:', vehicleVin);
            console.warn('Possible reasons:');
            console.warn('1. No warranty conditions created for this model');
            console.warn('2. All conditions are inactive (active = false)');
            console.warn('3. All conditions are outside effective date range');
            console.warn('4. Backend API filter logic issue');
            
            setWarrantyCheckResult('no_constraints');
            setWarrantyCheckReasons([
              `Không tìm thấy điều kiện bảo hành cho mẫu xe "${vehicleModelName}" (Model ID: ${vehicleModelId}).`,
              'Vui lòng kiểm tra trong "Quản lý Điều kiện Bảo hành":',
              `- Xem có điều kiện bảo hành cho Model ID ${vehicleModelId} không`,
              '- Kiểm tra trạng thái "Hoạt động" của điều kiện',
              '- Kiểm tra khoảng thời gian hiệu lực (Effective From/To)',
              'Nếu chưa có hoặc không hiệu lực, vui lòng tạo/cập nhật điều kiện bảo hành hoặc nhập thủ công.'
            ]);
            return;
          }
          
          // Get the most recent effective condition (usually the first one from API)
          const condition = conditions[0];
          
          // Check vehicle eligibility
          let vehicle = claim.vehicle;
          const vehicleIdFromClaim = vehicle?.id || claim?.vehicleId;
          
          // If warrantyStart or warrantyEnd is missing, try to fetch full vehicle details
          if ((!vehicle?.warrantyStart || !vehicle?.warrantyEnd) && vehicleIdFromClaim) {
            console.log('Warranty dates missing in claim, fetching vehicle details...');
            try {
              const vehicleResponse = await axios.get(
                `${process.env.REACT_APP_API_URL}/api/vehicles/${vehicleIdFromClaim}`,
                { headers: { 'Authorization': `Bearer ${token}` } }
              );
              
              if (vehicleResponse.status === 200 && vehicleResponse.data) {
                const fullVehicleData = vehicleResponse.data;
                console.log('Fetched full vehicle data:', fullVehicleData);
                // Merge with existing vehicle data, prefer fetched data for warranty dates
                vehicle = {
                  ...vehicle,
                  ...fullVehicleData,
                  warrantyStart: fullVehicleData.warrantyStart || vehicle?.warrantyStart,
                  warrantyEnd: fullVehicleData.warrantyEnd || vehicle?.warrantyEnd,
                  registrationDate: fullVehicleData.registrationDate || vehicle?.registrationDate
                };
                console.log('Merged vehicle data with warranty dates:', vehicle);
              }
            } catch (vehicleErr) {
              console.error('Error fetching vehicle details for warranty dates:', vehicleErr);
            }
          }
          
          const today = new Date();
          today.setHours(0, 0, 0, 0); // Set to start of day for accurate comparison
          
          // Get warranty dates - try multiple sources
          let warrantyStart = vehicle?.warrantyStart ? new Date(vehicle.warrantyStart) : null;
          let warrantyEnd = vehicle?.warrantyEnd ? new Date(vehicle.warrantyEnd) : null;
          const registrationDate = vehicle?.registrationDate ? new Date(vehicle.registrationDate) : null;
          const mileageKm = vehicle?.mileageKm || 0;
          
          // If warrantyStart is missing but we have registrationDate and condition has coverageYears,
          // we can calculate warrantyStart (usually same as registrationDate)
          if (!warrantyStart && registrationDate && condition.coverageYears) {
            console.log('Calculating warrantyStart from registrationDate:', registrationDate);
            warrantyStart = new Date(registrationDate);
            warrantyStart.setHours(0, 0, 0, 0);
          }
          
          // If warrantyEnd is missing but we have warrantyStart and condition has coverageYears,
          // we can calculate warrantyEnd
          if (!warrantyEnd && warrantyStart && condition.coverageYears && !condition.effectiveTo) {
            console.log('Calculating warrantyEnd from warrantyStart and coverageYears:', condition.coverageYears);
            warrantyEnd = new Date(warrantyStart);
            warrantyEnd.setFullYear(warrantyEnd.getFullYear() + condition.coverageYears);
            warrantyEnd.setHours(23, 59, 59, 999);
          }
          
          console.log('Final warranty dates:', {
            warrantyStart: warrantyStart ? warrantyStart.toISOString() : null,
            warrantyEnd: warrantyEnd ? warrantyEnd.toISOString() : null,
            registrationDate: registrationDate ? registrationDate.toISOString() : null,
            mileageKm: mileageKm
          });
          
          const reasons = [];
          let passes = true;
          
          // Check warranty start date
          if (!warrantyStart) {
            // If we still don't have warrantyStart after all attempts, it's a problem
            // But we'll allow manual override, so just warn
            passes = false;
            reasons.push('Thiếu ngày bắt đầu bảo hành. Vui lòng kiểm tra thông tin xe hoặc nhập thủ công.');
            if (registrationDate) {
              reasons.push(`Lưu ý: Có ngày đăng ký (${registrationDate.toLocaleDateString('vi-VN')}) nhưng không có ngày bắt đầu bảo hành.`);
            }
          } else {
            warrantyStart.setHours(0, 0, 0, 0);
            // Check if warranty start is after today (future warranty)
            if (warrantyStart > today) {
              passes = false;
              reasons.push(`Bảo hành chưa có hiệu lực. Ngày bắt đầu: ${warrantyStart.toLocaleDateString('vi-VN')}`);
            }
          }
          
          // Check warranty end date
          // Handle lifetime warranty (effectiveTo = null)
          const isLifetimeWarranty = condition.effectiveTo === null || condition.effectiveTo === undefined;
          
          if (!isLifetimeWarranty) {
            // Not lifetime warranty - must have warrantyEnd
            if (!warrantyEnd) {
              passes = false;
              reasons.push('Thiếu ngày kết thúc bảo hành');
            } else {
              warrantyEnd.setHours(23, 59, 59, 999); // Set to end of day for accurate comparison
              if (warrantyEnd < today) {
                passes = false;
                reasons.push(`Bảo hành đã hết hạn vào ${warrantyEnd.toLocaleDateString('vi-VN')}`);
              }
            }
          } else {
            // Lifetime warranty - warrantyEnd can be null
            if (warrantyEnd) {
              warrantyEnd.setHours(23, 59, 59, 999);
              if (warrantyEnd < today) {
                reasons.push(`Cảnh báo: Ngày kết thúc bảo hành (${warrantyEnd.toLocaleDateString('vi-VN')}) đã qua, nhưng điều kiện bảo hành là trọn đời.`);
                // Don't fail, just warn
              }
            }
          }
          
          // Check mileage if condition has coverageKm
          if (condition.coverageKm != null && mileageKm > condition.coverageKm) {
            passes = false;
            reasons.push(`Số km (${mileageKm.toLocaleString('vi-VN')} km) vượt quá giới hạn bảo hành (${condition.coverageKm.toLocaleString('vi-VN')} km)`);
          }
          
          // Check warranty duration if condition has coverageYears and warranty dates exist
          if (condition.coverageYears != null && warrantyStart && warrantyEnd && !isLifetimeWarranty) {
            const warrantyDurationYears = (warrantyEnd - warrantyStart) / (1000 * 60 * 60 * 24 * 365);
            if (warrantyDurationYears > condition.coverageYears + 0.1) { // Allow small margin for rounding
              reasons.push(`Cảnh báo: Thời hạn bảo hành (${warrantyDurationYears.toFixed(1)} năm) vượt quá thời hạn quy định (${condition.coverageYears} năm)`);
              // Don't fail, just warn
            }
          }
          
          // Check effective date range if condition has effectiveFrom/effectiveTo
          if (condition.effectiveFrom && warrantyStart) {
            const effectiveFrom = new Date(condition.effectiveFrom);
            effectiveFrom.setHours(0, 0, 0, 0);
            if (warrantyStart < effectiveFrom) {
              reasons.push(`Cảnh báo: Ngày bắt đầu bảo hành (${warrantyStart.toLocaleDateString('vi-VN')}) sớm hơn ngày hiệu lực của điều kiện (${effectiveFrom.toLocaleDateString('vi-VN')})`);
              // Don't fail, just warn
            }
          }
          
          if (!isLifetimeWarranty && condition.effectiveTo && warrantyEnd) {
            const effectiveTo = new Date(condition.effectiveTo);
            effectiveTo.setHours(23, 59, 59, 999);
            if (warrantyEnd > effectiveTo) {
              reasons.push(`Cảnh báo: Ngày kết thúc bảo hành (${warrantyEnd.toLocaleDateString('vi-VN')}) muộn hơn ngày hết hiệu lực của điều kiện (${effectiveTo.toLocaleDateString('vi-VN')})`);
              // Don't fail, just warn
            }
          }
          
          // If passes, show success message with reasons
          if (passes) {
            const passReasons = [];
            if (warrantyStart) {
              passReasons.push(`Ngày bắt đầu bảo hành: ${warrantyStart.toLocaleDateString('vi-VN')}`);
            }
            if (isLifetimeWarranty) {
              passReasons.push('Bảo hành trọn đời (không có thời hạn)');
            } else if (warrantyEnd) {
              passReasons.push(`Bảo hành còn hiệu lực đến ${warrantyEnd.toLocaleDateString('vi-VN')}`);
            }
            if (condition.coverageKm != null) {
              passReasons.push(`Số km trong giới hạn: ${mileageKm.toLocaleString('vi-VN')} km ≤ ${condition.coverageKm.toLocaleString('vi-VN')} km`);
            }
            if (condition.coverageYears != null) {
              passReasons.push(`Thời hạn bảo hành: ${condition.coverageYears} năm`);
            }
            if (condition.effectiveFrom) {
              passReasons.push(`Điều kiện hiệu lực từ: ${new Date(condition.effectiveFrom).toLocaleDateString('vi-VN')}`);
            }
            if (!isLifetimeWarranty && condition.effectiveTo) {
              passReasons.push(`Điều kiện hiệu lực đến: ${new Date(condition.effectiveTo).toLocaleDateString('vi-VN')}`);
            } else if (isLifetimeWarranty) {
              passReasons.push('Điều kiện hiệu lực đến: N/A (Bảo hành trọn đời)');
            }
            if (condition.conditionsText) {
              passReasons.push(`Ghi chú: ${condition.conditionsText}`);
            }
            setWarrantyCheckResult('pass');
            setWarrantyCheckReasons(passReasons);
            
            // Auto-populate warranty eligibility fields when check passes
            if (!warrantyEligibilityAssessment || warrantyEligibilityAssessment.trim() === '') {
              setWarrantyEligibilityAssessment(
                `Xe đủ điều kiện bảo hành:\n${passReasons.join('\n')}`
              );
            }
            if (isWarrantyEligible === null) {
              setIsWarrantyEligible(true);
            }
          } else {
            // Failed - show failure message
            setWarrantyCheckResult('fail');
            setWarrantyCheckReasons(reasons);
            // Don't show customer action prompt automatically - allow technician to override
            // Reset override checkbox when check fails
            setWarrantyOverrideConfirmed(false);
          }
        }
      } catch (err) {
        console.error('Error checking warranty:', err);
        console.error('Error response:', err.response?.data);
        console.error('Error status:', err.response?.status);
        console.error('Error config (URL/params):', err.config?.url, err.config?.params);
        
        // On error, treat as no constraints (allow manual input)
        setWarrantyCheckResult('no_constraints');
        setWarrantyCheckReasons(['Không thể kiểm tra điều kiện bảo hành tự động. Vui lòng nhập thủ công.']);
      }
    };
    
    performWarrantyCheck();
  }, [claim, repairType]);

  // --- Search Logic Helper (UNMODIFIED) ---
  const performPartSearch = (query) => {
    const queryLower = query.toLowerCase();
    if (queryLower.length < 2) return [];

    const filteredParts = allPartSerials.filter(part => 
      part.status === 'in_stock' && ( 
        part.partName.toLowerCase().includes(queryLower) ||
        part.partNumber.toLowerCase().includes(queryLower) ||
        String(part.partId).includes(queryLower)
      )
    );
    
    const uniqueParts = [];
    const seenPartKeys = new Set();
    
    filteredParts.forEach(part => {
        const partKey = `${part.partId}-${part.partName}`;
        if (!seenPartKeys.has(partKey)) {
            uniqueParts.push(part);
            seenPartKeys.add(partKey);
        }
    });

    return uniqueParts;
  };
  // --- End Search Logic Helper ---

  // --- Part Management Handlers (UNMODIFIED) ---
  const handlePartChange = (index, field, value) => {
    const newParts = [...requiredParts];
    newParts[index][field] = value;

    if (field === 'searchQuery') {
      newParts[index].searchResults = performPartSearch(value);
      newParts[index].showResults = true;
      newParts[index].partId = '';
      newParts[index].partName = '';
    } else if (field === 'quantity') {
      newParts[index].quantity = Math.max(1, parseInt(value, 10) || 1); 
    }
    
    setRequiredParts(newParts);
  };
  
  const handlePartSelect = (index, part) => {
    const newParts = [...requiredParts];
    newParts[index] = {
      ...newParts[index],
      partId: String(part.partId), 
      partName: part.partName,
      searchQuery: part.partName, 
      searchResults: [],
      showResults: false,
    };
    setRequiredParts(newParts);
  };
  
  const handleInputFocus = (index) => {
      const newParts = [...requiredParts];
      if (newParts[index].searchQuery.length > 0 && newParts[index].searchResults.length > 0) {
          newParts[index].showResults = true;
      }
      setRequiredParts(newParts);
  }

  const handleInputBlur = (index) => {
    setTimeout(() => {
        setRequiredParts(prev => prev.map((item, i) => 
            i === index ? { ...item, showResults: false } : item
        ));
    }, 200); 
  }

  const handleAddPart = () => {
    const lastPart = requiredParts[requiredParts.length - 1];
    if (lastPart && lastPart.partId && lastPart.partName && lastPart.quantity > 0) {
        setRequiredParts([...requiredParts, initialPart]);
    } else if (requiredParts.length === 1 && !lastPart.partId) {
         setRequiredParts([...requiredParts, initialPart]);
    } else {
         toast.warn('Vui lòng hoàn tất mục phụ tùng hiện tại trước khi thêm mục mới.');
    }
  };

  const handleRemovePart = async (index) => {
    const partToRemove = requiredParts[index];
    
    // If it's a third-party part with reserved serials, release them
    if (partToRemove?.isThirdParty && partToRemove?.thirdPartyPartId && claim?.id) {
      try {
        const user = JSON.parse(localStorage.getItem('user'));
        const token = user?.token;
        
        if (token) {
          // Release reserved serials for this claim and part
          await axios.delete(
            `${process.env.REACT_APP_API_URL}/api/third-party-parts/serials/release/${claim.id}/${partToRemove.thirdPartyPartId}`,
            { headers: { 'Authorization': `Bearer ${token}` } }
          );
          
          // Clear status message for this part
          setPartSerialStatus(prev => {
            const updated = { ...prev };
            delete updated[partToRemove.thirdPartyPartId];
            return updated;
          });
        }
      } catch (error) {
        console.error('Error releasing reserved serials:', error);
        // Continue with removal even if release fails
        toast.warning('Đã xóa phụ tùng nhưng có thể không giải phóng serial. Vui lòng kiểm tra lại.');
      }
    }
    
    // Remove the part from the list
    const newParts = requiredParts.filter((_, i) => i !== index); 
    setRequiredParts(newParts.length > 0 ? newParts : [initialPart]); 
  };
  // --- End Part Management Handlers ---
  
  // ===== NEW: Service Search with API Calls =====
  useEffect(() => {
    if (!serviceSearchQuery || serviceSearchQuery.trim().length < 2) {
      setServiceSearchResults([]);
      setShowServiceSearchResults(false);
      return;
    }

    const searchServices = async () => {
      setServiceSearchLoading(true);
      try {
        const user = JSON.parse(localStorage.getItem('user'));
        const token = user.token;
        
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/service-catalog/services`,
          {
            params: {
              page: 0,
              size: 20,
              search: serviceSearchQuery,
              active: true
            },
            headers: { 'Authorization': `Bearer ${token}` }
          }
        );
        
        if (response.status === 200) {
          const results = response.data.content || response.data || [];
          setServiceSearchResults(results);
          setShowServiceSearchResults(true);
        }
      } catch (err) {
        console.error('Error searching services:', err);
        setServiceSearchResults([]);
        toast.error('Không thể tìm kiếm dịch vụ. Vui lòng thử lại.');
      } finally {
        setServiceSearchLoading(false);
      }
    };

    const debounceTimer = setTimeout(() => searchServices(), 300);
    return () => clearTimeout(debounceTimer);
  }, [serviceSearchQuery]);
  
  // ===== NEW: Third Party Parts Search with API Calls =====
  useEffect(() => {
    if (!thirdPartyPartSearchQuery || thirdPartyPartSearchQuery.trim().length < 2) {
      setThirdPartyPartSearchResults([]);
      setShowThirdPartyPartSearchResults(false);
      return;
    }

    // Only search if we're in SC_REPAIR mode
    if (repairType !== 'SC_REPAIR') {
      return;
    }

    const searchThirdPartyParts = async () => {
      setThirdPartyPartSearchLoading(true);
      try {
        const user = JSON.parse(localStorage.getItem('user'));
        const token = user?.token;
        
        if (!user?.serviceCenterId) {
          setThirdPartyPartSearchResults([]);
          return;
        }
        
        // Use API to get third-party parts for the service center
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/third-party-parts/service-center/${user.serviceCenterId}`,
          {
            headers: { 'Authorization': `Bearer ${token}` }
          }
        );
        
        if (response.status === 200) {
          const allParts = response.data || [];
          const queryLower = thirdPartyPartSearchQuery.toLowerCase();
          const filtered = allParts.filter(part => 
            part.name?.toLowerCase().includes(queryLower) ||
            part.partNumber?.toLowerCase().includes(queryLower) ||
            String(part.id).includes(queryLower)
          );
          
          // Enrich with prices from catalog
          const enrichedParts = await Promise.all(
            filtered.map(async (part) => {
              try {
                const priceResponse = await axios.get(
                  `${process.env.REACT_APP_API_URL}/api/service-catalog/prices/current/THIRD_PARTY_PART/${part.id}`,
                  { headers: { 'Authorization': `Bearer ${token}` } }
                );
                if (priceResponse.status === 200 && priceResponse.data?.price) {
                  return {
                    ...part,
                    catalogPrice: priceResponse.data.price,
                    effectivePrice: priceResponse.data.price,
                    priceRegion: priceResponse.data.region
                  };
                }
              } catch (priceError) {
                // Use unitCost as fallback
              }
              return {
                ...part,
                catalogPrice: part.unitCost,
                effectivePrice: part.unitCost
              };
            })
          );
          
          setThirdPartyPartSearchResults(enrichedParts);
          setShowThirdPartyPartSearchResults(true);
        }
      } catch (err) {
        console.error('Error searching third-party parts:', err);
        setThirdPartyPartSearchResults([]);
        toast.error('Không thể tìm kiếm phụ tùng bên thứ 3. Vui lòng thử lại.');
      } finally {
        setThirdPartyPartSearchLoading(false);
      }
    };

    const debounceTimer = setTimeout(() => searchThirdPartyParts(), 300);
    return () => clearTimeout(debounceTimer);
  }, [thirdPartyPartSearchQuery, repairType]);
  
  // ===== NEW: Service Catalog Handlers =====
  const handleAddServiceItem = async (serviceItem) => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const token = user.token;
      
      // Try to fetch current price for this service item
      let currentPrice = serviceItem.currentPrice || 0;
      
      try {
        const priceResponse = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/service-catalog/prices/current/SERVICE/${serviceItem.id}`,
          {
            headers: { 'Authorization': `Bearer ${token}` }
          }
        );
        
        if (priceResponse.status === 200 && priceResponse.data?.price) {
          currentPrice = priceResponse.data.price;
        }
      } catch (priceErr) {
        // If price doesn't exist (404), use the currentPrice from serviceItem or 0
        if (priceErr.response?.status !== 404) {
          console.warn('Error fetching price for service:', priceErr);
        }
        // Continue with currentPrice from serviceItem or 0
      }
      
      const newServiceItem = {
        serviceItemId: serviceItem.id,
        serviceItemCode: serviceItem.serviceCode,
        serviceItemName: serviceItem.name,
        standardLaborHours: serviceItem.standardLaborHours || 0,
        unitPrice: currentPrice,
        quantity: 1,
        totalPrice: currentPrice,
        notes: ''
      };
      
      const updatedItems = [...serviceCatalogItems, newServiceItem];
      setServiceCatalogItems(updatedItems);
      updateTotalServiceCost(updatedItems);
      
      // Auto-calculate labor hours
      const totalLaborHours = updatedItems.reduce((sum, item) => 
        sum + (parseFloat(item.standardLaborHours || 0) * parseInt(item.quantity || 1)), 0
      );
      setLaborHours(totalLaborHours.toFixed(1));
      
      toast.success(`Đã thêm dịch vụ: ${newServiceItem.serviceItemName}`);
    } catch (err) {
      console.error('Error adding service item:', err);
      toast.error('Không thể thêm dịch vụ. Vui lòng thử lại.');
    }
  };
  
  const handleUpdateServiceItem = (index, field, value) => {
    const newItems = [...serviceCatalogItems];
    if (field === 'quantity') {
      newItems[index].quantity = Math.max(1, parseInt(value, 10) || 1);
      newItems[index].totalPrice = newItems[index].unitPrice * newItems[index].quantity;
    } else if (field === 'unitPrice') {
      newItems[index].unitPrice = parseFloat(value) || 0;
      newItems[index].totalPrice = newItems[index].unitPrice * newItems[index].quantity;
    } else {
      newItems[index][field] = value;
    }
    setServiceCatalogItems(newItems);
    updateTotalServiceCost(newItems);
    
    // Auto-calculate labor hours whenever services change
    const totalLaborHours = newItems.reduce((sum, item) => 
      sum + (parseFloat(item.standardLaborHours || 0) * parseInt(item.quantity || 1)), 0
    );
    setLaborHours(totalLaborHours.toFixed(1));
  };
  
  const handleRemoveServiceItem = (index) => {
    const newItems = serviceCatalogItems.filter((_, i) => i !== index);
    setServiceCatalogItems(newItems);
    updateTotalServiceCost(newItems);
    
    // Auto-calculate labor hours after removal
    const totalLaborHours = newItems.reduce((sum, item) => 
      sum + (parseFloat(item.standardLaborHours || 0) * parseInt(item.quantity || 1)), 0
    );
    setLaborHours(totalLaborHours.toFixed(1));
  };
  
  const updateTotalServiceCost = (items) => {
    const total = items.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
    setTotalServiceCost(total);
  };
  
  // ===== NEW: Third Party Parts Handlers (for SC Repair) =====
  const handleAddThirdPartyPart = async (part, quantity = 1, targetIndex = null) => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const token = user?.token;
      
      // Get vehicle ID from claim.vehicle.id (nested object)
      const vehicleId = claim?.vehicle?.id;
      
      if (!token || !claim || !vehicleId) {
        toast.error('Không thể xác thực hoặc thiếu thông tin yêu cầu. Vui lòng đảm bảo claim và vehicle đã được tải.');
        return;
      }

      // Get price from catalog or use unitCost
      let unitPrice = part.effectivePrice || part.catalogPrice || part.unitCost || 0;
      
      if (!part.catalogPrice && !part.effectivePrice) {
        try {
          const priceResponse = await axios.get(
            `${process.env.REACT_APP_API_URL}/api/service-catalog/prices/current/THIRD_PARTY_PART/${part.id}`,
            { headers: { 'Authorization': `Bearer ${token}` } }
          );
          if (priceResponse.status === 200 && priceResponse.data?.price) {
            unitPrice = priceResponse.data.price;
          }
        } catch (priceError) {
          // Use unitCost as fallback
        }
      }

      // Check and reserve serials
      const reserveRequest = {
        claimId: claim.id,
        vehicleId: vehicleId,
        parts: [{
          thirdPartyPartId: part.id,
          quantity: quantity
        }]
      };

      const reserveResponse = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/third-party-parts/serials/reserve`,
        reserveRequest,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      if (reserveResponse.status === 200) {
        const reserveResult = reserveResponse.data;
        const partResult = reserveResult.results[0];
        
        // Update status message
        setPartSerialStatus(prev => ({
          ...prev,
          [part.id]: {
            message: partResult.message,
            status: partResult.status,
            reservedQuantity: partResult.reservedQuantity,
            requestedQuantity: partResult.requestedQuantity,
            availableQuantity: partResult.availableQuantity
          }
        }));

        const partData = {
          thirdPartyPartId: part.id,
          partName: part.name,
          unitPrice: unitPrice,
          quantity: quantity,
          totalPrice: unitPrice * quantity,
          notes: '',
          partNumber: part.partNumber,
          isThirdParty: true,
          searchQuery: part.name,
          showResults: false,
          searchResults: [],
          serialStatus: partResult.status,
          reservedSerials: partResult.reservedSerialNumbers || []
        };
        
        const newParts = [...requiredParts];
        
        // If targetIndex is provided, update that specific row
        if (targetIndex !== null && targetIndex >= 0 && targetIndex < requiredParts.length) {
          const currentPart = requiredParts[targetIndex];
          // If the current row already has the same part, increment quantity
          if (currentPart.thirdPartyPartId === part.id) {
            newParts[targetIndex] = {
              ...newParts[targetIndex],
              ...partData,
              quantity: (newParts[targetIndex].quantity || 0) + quantity,
              totalPrice: unitPrice * ((newParts[targetIndex].quantity || 0) + quantity)
            };
          } else {
            // Replace the current row with the new part
            newParts[targetIndex] = {
              ...initialPart,
              ...partData
            };
          }
        } else {
          // No target index - check if part already exists elsewhere
          const existingIndex = requiredParts.findIndex(p => 
            p.thirdPartyPartId === part.id
          );
          
          if (existingIndex >= 0) {
            // Update existing part (increment quantity)
            newParts[existingIndex] = {
              ...newParts[existingIndex],
              ...partData,
              quantity: (newParts[existingIndex].quantity || 0) + quantity,
              totalPrice: unitPrice * ((newParts[existingIndex].quantity || 0) + quantity)
            };
          } else {
            // Add new part only if it doesn't exist
            newParts.push({
              ...initialPart,
              ...partData
            });
          }
        }
        
        setRequiredParts(newParts);
        
        // Show status message
        if (partResult.status === 'ALL_RESERVED') {
          toast.success(partResult.message);
        } else if (partResult.status === 'PARTIAL') {
          toast.warning(partResult.message);
        } else {
          toast.error(partResult.message);
        }
      }
    } catch (error) {
      console.error('Error adding third-party part:', error);
      const errorMsg = error.response?.data?.message || 'Không thể thêm phụ tùng bên thứ 3. Vui lòng thử lại.';
      toast.error(errorMsg);
    }
  };
  
  const handleUpdateThirdPartyPartPrice = (index, price) => {
    const newParts = [...requiredParts];
    newParts[index].unitPrice = parseFloat(price) || 0;
    newParts[index].totalPrice = newParts[index].unitPrice * newParts[index].quantity;
    setRequiredParts(newParts);
  };
  
  // Handle quantity change for third-party parts (re-check and reserve serials)
  const handleUpdateThirdPartyPartQuantity = async (index, newQuantity) => {
    const part = requiredParts[index];
    const vehicleId = claim?.vehicle?.id;
    
    if (!part.thirdPartyPartId || !claim || !vehicleId) {
      toast.error('Không thể cập nhật số lượng. Vui lòng đảm bảo claim và vehicle đã được tải.');
      return;
    }
    
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const token = user?.token;
      
      // Check and reserve serials for new quantity
      const reserveRequest = {
        claimId: claim.id,
        vehicleId: vehicleId,
        parts: [{
          thirdPartyPartId: part.thirdPartyPartId,
          quantity: newQuantity
        }]
      };

      const reserveResponse = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/third-party-parts/serials/reserve`,
        reserveRequest,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      if (reserveResponse.status === 200) {
        const reserveResult = reserveResponse.data;
        const partResult = reserveResult.results[0];
        
        // Update status message
        setPartSerialStatus(prev => ({
          ...prev,
          [part.thirdPartyPartId]: {
            message: partResult.message,
            status: partResult.status,
            reservedQuantity: partResult.reservedQuantity,
            requestedQuantity: partResult.requestedQuantity,
            availableQuantity: partResult.availableQuantity
          }
        }));

        // Update part data
        const newParts = [...requiredParts];
        newParts[index] = {
          ...newParts[index],
          quantity: newQuantity,
          totalPrice: newParts[index].unitPrice * newQuantity,
          serialStatus: partResult.status,
          reservedSerials: partResult.reservedSerialNumbers || []
        };
        setRequiredParts(newParts);
        
        // Show status message
        if (partResult.status === 'ALL_RESERVED') {
          toast.success(partResult.message);
        } else if (partResult.status === 'PARTIAL') {
          toast.warning(partResult.message);
        } else {
          toast.error(partResult.message);
        }
      }
    } catch (error) {
      console.error('Error updating quantity:', error);
      toast.error('Không thể cập nhật số lượng. Vui lòng thử lại.');
    }
  };

  
  // --- File Upload Logic (UNMODIFIED) ---
  
  const uploadFileImmediately = async (file, token) => {
      const fileName = file.name;

      // 1. Add to uploading state
      setUploadingFiles(prev => [...prev, fileName]);
      
      const formData = new FormData();
      formData.append('file', file);

      try {
          const response = await axios.post(
              `${process.env.REACT_APP_API_URL}/api/claims/${claimId}/attachments/upload`,
              formData,
              {
                  headers: {
                      'Authorization': `Bearer ${token}`,
                      'Content-Type': 'multipart/form-data',
                  },
              }
          );

          if (response.status === 200 || response.status === 201) {
              toast.success(`Tệp ${fileName} đã được tải lên thành công.`);
              // Add successful upload to existing attachments list
              setExistingAttachments(prev => [...prev, response.data]);
          } else {
              toast.error(`Không thể tải lên tệp ${fileName}: Lỗi máy chủ.`);
          }
      } catch (error) {
          toast.error(`Không thể tải lên tệp ${fileName}: ${error.response?.data?.message || error.message}`);
      } finally {
          // 2. Remove from uploading state
          setUploadingFiles(prev => prev.filter(name => name !== fileName));
      }
  };

  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files || []).filter(Boolean);
    const user = JSON.parse(localStorage.getItem('user'));
    
    if (!user || !user.token) {
        toast.error('Người dùng chưa được xác thực. Không thể tải lên tệp.');
        return;
    }
    const token = user.token;

    newFiles.forEach(file => {
        // Prevent duplicate uploads (by name, regardless of case)
        const fileNameLower = file.name.toLowerCase();
        const isDuplicate = existingAttachments.some(att => att.filePath.toLowerCase().includes(fileNameLower)) ||
                            uploadingFiles.map(n => n.toLowerCase()).includes(fileNameLower);
        
        if (!isDuplicate) {
            uploadFileImmediately(file, token);
        } else {
            toast.warn(`Tệp "${file.name}" đã được tải lên hoặc đang được tải lên.`);
        }
    });

    if (fileInputRef.current) {
        fileInputRef.current.value = null; // Clear the file input
    }
  };
  
  const handleDownloadAttachment = async (attachment) => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || !user.token) {
      toast.error('Người dùng chưa được xác thực.');
      return;
    }
    
    try {
      // Use downloadUrl if available, otherwise construct from filePath
      let downloadUrl;
      if (attachment.downloadUrl) {
        downloadUrl = `${process.env.REACT_APP_API_URL}${attachment.downloadUrl}`;
      } else if (attachment.id && claimId) {
        // Fallback: use API endpoint
        downloadUrl = `${process.env.REACT_APP_API_URL}/api/claims/${claimId}/attachments/${attachment.id}/download`;
      } else {
        // Last resort: try static file serving
        const fileName = attachment.filePath?.split('/').pop() || attachment.fileName || 'attachment';
        downloadUrl = `${process.env.REACT_APP_API_URL}/uploads/attachments/${fileName}`;
      }
      
      const response = await axios.get(downloadUrl, {
        headers: {
          'Authorization': `Bearer ${user.token}`
        },
        responseType: 'blob'
      });
      
      // Create blob and download
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = attachment.originalFileName || attachment.fileName || attachment.filePath?.split('/').pop() || 'attachment';
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
      
      toast.success(`Đã tải xuống ${link.download}`);
    } catch (error) {
      toast.error(`Không thể tải xuống tệp: ${error.response?.data?.message || error.message}`);
    }
  };

  
  const handleDeleteAttachment = async (attachmentId) => {
      if (isSubmitting) return;

      const user = JSON.parse(localStorage.getItem('user'));
      if (!user || !user.token) {
          toast.error('Người dùng chưa được xác thực.');
          return;
      }

      setIsSubmitting(true);
      try {
          const response = await axios.delete(
              `${process.env.REACT_APP_API_URL}/api/claims/${claimId}/attachments/${attachmentId}`,
              { headers: { 'Authorization': `Bearer ${user.token}` } }
          );

          if (response.status === 200 || response.status === 204) {
              toast.success('Tệp đính kèm đã được xóa thành công.');
              setExistingAttachments(prev => prev.filter(att => att.id !== attachmentId));
          } else {
              toast.error('Không thể xóa tệp đính kèm: Lỗi máy chủ.');
          }
      } catch (error) {
          toast.error(`Không thể xóa tệp đính kèm: ${error.response?.data?.message || error.message}`);
      } finally {
          setIsSubmitting(false);
      }
  };
  // --- END File Upload Logic ---
  
  
  // ===== NEW: Customer Action Handlers =====
  const handleUpdateStatusToCustomerAction = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const token = user?.token;
      
      if (!token || !claimId) {
        toast.error('Không thể xác thực. Vui lòng thử lại.');
        return;
      }
      
      // Update status to CUSTOMER_ACTION_NEEDED
      const statusUpdateResponse = await axios.put(
        `${process.env.REACT_APP_API_URL}/api/claims/${claimId}/status`,
        { status: 'CUSTOMER_ACTION_NEEDED' },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      if (statusUpdateResponse.status === 200) {
        toast.success('Đã cập nhật trạng thái claim thành công.');
        setShowCustomerActionPrompt(false);
        // Optionally refresh claim data
        if (handleBackClick) {
          handleBackClick();
        }
      }
    } catch (err) {
      console.error('Error updating claim status:', err);
      const errorMsg = err.response?.data?.message || 'Không thể cập nhật trạng thái claim.';
      toast.error(errorMsg);
    }
  };
  
  const handleMoveOnSCRepair = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const token = user?.token;
      
      if (!token || !claimId) {
        toast.error('Không thể xác thực. Vui lòng thử lại.');
        return;
      }
      
      // Update claim status to MOVE_ON_SC_REPAIR
      const statusUpdateResponse = await axios.put(
        `${process.env.REACT_APP_API_URL}/api/claims/${claimId}/status`,
        { status: 'MOVE_ON_SC_REPAIR' },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      if (statusUpdateResponse.status === 200) {
        // Also update repair type to SC_REPAIR
        setRepairType('SC_REPAIR');
        setWarrantyCheckResult(null);
        setShowCustomerActionPrompt(false);
        toast.success('Đã chuyển sang luồng SC Repair. Vui lòng điền thông tin sửa chữa.');
      }
    } catch (err) {
      console.error('Error moving to SC repair:', err);
      const errorMsg = err.response?.data?.message || 'Không thể chuyển sang SC Repair.';
      toast.error(errorMsg);
    }
  };
  
  const handleCancelClaim = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const token = user?.token;
      
      if (!token || !claimId) {
        toast.error('Không thể xác thực. Vui lòng thử lại.');
        return;
      }
      
      // Update claim status to CANCELLED
      const statusUpdateResponse = await axios.put(
        `${process.env.REACT_APP_API_URL}/api/claims/${claimId}/status`,
        { status: 'CANCELLED' },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      if (statusUpdateResponse.status === 200) {
        toast.success('Đã hủy claim thành công.');
        setShowCustomerActionPrompt(false);
        if (handleBackClick) {
          handleBackClick();
        }
      }
    } catch (err) {
      console.error('Error cancelling claim:', err);
      const errorMsg = err.response?.data?.message || 'Không thể hủy claim.';
      toast.error(errorMsg);
    }
  };
  // ===== END Customer Action Handlers =====
  
  // --- Form Submission (MODIFIED PAYLOAD) ---
  const handleSubmitDiagnostic = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    // Validation update: CHECK ALL REQUIRED FIELDS
    const missingFields = [];
    if (!diagnosticSummary || diagnosticSummary.trim() === '') {
      missingFields.push('Tóm tắt Chẩn đoán');
    }
    if (!initialDiagnosis || initialDiagnosis.trim() === '') {
      missingFields.push('Chẩn đoán Ban đầu');
    }
    if (!testResults || testResults.trim() === '') {
      missingFields.push('Kết quả Kiểm tra');
    }
    if (!repairNotes || repairNotes.trim() === '') {
      missingFields.push('Ghi chú Sửa chữa');
    }
    if (!laborHours || laborHours === '' || parseFloat(laborHours) <= 0) {
      missingFields.push('Giờ Lao động');
    }
    if (!diagnosticDetails || diagnosticDetails.trim() === '') {
      missingFields.push('Chi tiết Chẩn đoán');
    }
    
    if (missingFields.length > 0) {
      toast.warn(`Vui lòng điền các trường bắt buộc: ${missingFields.join(', ')}`);
      return;
    }
    
    // ===== NEW: Warranty eligibility assessment validation (only for EVM_REPAIR) =====
    if (repairType === 'EVM_REPAIR') {
      // If warranty check failed, require override confirmation
      if (warrantyCheckResult === 'fail' && !warrantyOverrideConfirmed) {
        toast.error('Vui lòng xác nhận rằng xe đáp ứng đầy đủ các điều kiện bảo hành bằng cách chọn checkbox xác nhận.');
        return;
      }
      
      // Always require warranty eligibility assessment (even if check passed, allow manual override)
      if (!warrantyEligibilityAssessment || warrantyEligibilityAssessment.trim() === '') {
        toast.warn('Vui lòng nhập "Điều kiện bảo hành được chấp nhận".');
        return;
      }
      
      if (isWarrantyEligible === null) {
        toast.warn('Vui lòng chọn xe có đủ điều kiện bảo hành hay không.');
        return;
      }
      
      // For warranty check pass case, ensure fields are set (should be auto-populated, but double-check)
      if (warrantyCheckResult === 'pass') {
        if (!warrantyEligibilityAssessment || warrantyEligibilityAssessment.trim() === '') {
          // Auto-populate if somehow still empty
          const autoText = warrantyCheckReasons.join('\n');
          setWarrantyEligibilityAssessment(`Xe đủ điều kiện bảo hành:\n${autoText}`);
        }
        if (isWarrantyEligible === null) {
          setIsWarrantyEligible(true);
        }
      }
    }
    
    // ===== NEW: Repair type specific validation =====
    if (repairType === 'SC_REPAIR') {
      // For SC Repair, service catalog items are required
      if (!serviceCatalogItems || serviceCatalogItems.length === 0) {
        toast.warn('Vui lòng thêm ít nhất một dịch vụ trong phần Đơn giá.');
        return;
      }
      // Third party parts pricing validation
      const invalidParts = requiredParts.filter(p => 
        p.thirdPartyPartId && (!p.unitPrice || p.unitPrice <= 0)
      );
      if (invalidParts.length > 0) {
        toast.warn('Vui lòng nhập giá cho tất cả phụ tùng bên thứ 3.');
        return;
      }
    } else {
      // For EVM Repair, service catalog items are required (totalServiceCost is calculated from them)
      if (!serviceCatalogItems || serviceCatalogItems.length === 0) {
        toast.warn('Vui lòng thêm ít nhất một dịch vụ trong phần Đơn giá cho EVM Repair.');
        return;
      }
      if (totalServiceCost <= 0) {
        toast.warn('Tổng chi phí dịch vụ phải lớn hơn 0. Vui lòng kiểm tra lại các dịch vụ đã chọn.');
        return;
      }
    }
    
    // NEW REQUIRED FIELD CHECK: readyForSubmission must be true (for EVM Repair)
    if (repairType === 'EVM_REPAIR' && !readyForSubmission) {
      toast.error('Bạn phải chọn "Sẵn sàng Gửi" để hoàn tất và gửi báo cáo chẩn đoán.');
      return;
    }
    
    // ===== NEW: Validate reportedFailure when readyForSubmission is true =====
    if (readyForSubmission && (!reportedFailure || reportedFailure.trim().length < 10)) {
      toast.error('Mô tả lỗi đã báo cáo phải có ít nhất 10 ký tự khi chọn "Sẵn sàng Gửi".');
      return;
    }
    
    if (uploadingFiles.length > 0) {
        toast.warn('Vui lòng đợi tất cả tệp đính kèm tải lên xong trước khi gửi chẩn đoán.');
        return;
    }
    
    const partsUsed = requiredParts
      .filter(part => (part.partId || part.thirdPartyPartId) && part.partName && part.quantity > 0)
      .map(part => {
        if (part.thirdPartyPartId) {
          // Third party part with reserved serials
          return {
            thirdPartyPartId: part.thirdPartyPartId,
            unitPrice: part.unitPrice || 0,
            totalPrice: (part.unitPrice || 0) * part.quantity,
            quantity: Number(part.quantity),
            notes: part.notes || `${part.partName} cần thiết cho sửa chữa.`,
            reservedSerials: part.reservedSerials || [], // Include reserved serial numbers
            serialStatus: part.serialStatus || 'UNKNOWN' // Include serial reservation status
          };
        } else {
          // EVM part
          return {
            partId: Number(part.partId),
            partSerialId: null, 
            quantity: Number(part.quantity),
            notes: part.notes || `${part.partName} cần thiết cho sửa chữa.`,
          };
        }
      });
      
    // Validate parts - check both EVM parts (partId) and third-party parts (thirdPartyPartId)
    for (const part of partsUsed) {
        if (part.partId !== undefined) {
            // EVM part validation
            if (isNaN(part.partId) || part.partId <= 0 || part.quantity <= 0) {
                toast.error('Tất cả phụ tùng bắt buộc phải có ID Phụ tùng và Số lượng hợp lệ.');
                return;
            }
        } else if (part.thirdPartyPartId !== undefined) {
            // Third-party part validation
            if (isNaN(part.thirdPartyPartId) || part.thirdPartyPartId <= 0 || part.quantity <= 0) {
                toast.error('Tất cả phụ tùng bắt buộc phải có ID Phụ tùng và Số lượng hợp lệ.');
                return;
            }
        } else {
            // Neither partId nor thirdPartyPartId
            toast.error('Tất cả phụ tùng bắt buộc phải có ID Phụ tùng và Số lượng hợp lệ.');
            return;
        }
    }
    if (requiredParts.length === 1 && !requiredParts[0].partId && !requiredParts[0].partName && requiredParts[0].quantity === 1) {
        partsUsed.length = 0; 
    }
    
    const attachmentPaths = existingAttachments.map(att => att.filePath);


    setIsSubmitting(true);

    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const token = user.token;
      
      // --- STEP 2: Submit Diagnostic Data (COMPREHENSIVE PAYLOAD) ---
      const payload = {
        claimId: claimId,
        diagnosticSummary: diagnosticSummary,
        testResults: testResults,
        repairNotes: repairNotes,
        laborHours: parseFloat(laborHours),
        initialDiagnosis: initialDiagnosis,
        readyForSubmission: repairType === 'EVM_REPAIR' ? readyForSubmission : false,
        diagnosticDetails: diagnosticDetails, 
        // Round to 2 decimal places to match database precision (12,2)
        // For EVM_REPAIR: always use totalServiceCost from service catalog items
        warrantyCost: repairType === 'EVM_REPAIR' 
          ? Math.round((totalServiceCost || 0) * 100) / 100
          : null,
        // ===== NEW: Reported failure description =====
        reportedFailure: reportedFailure,
        // ===== NEW: Warranty eligibility fields (only for EVM_REPAIR) =====
        warrantyEligibilityAssessment: repairType === 'EVM_REPAIR' ? warrantyEligibilityAssessment : null,
        isWarrantyEligible: repairType === 'EVM_REPAIR' ? isWarrantyEligible : null,
        warrantyEligibilityNotes: repairType === 'EVM_REPAIR' ? warrantyEligibilityNotes : null,
        // ===== NEW: Warranty override confirmation (only for EVM_REPAIR when check fails) =====
        warrantyOverrideConfirmed: repairType === 'EVM_REPAIR' && warrantyCheckResult === 'fail' ? warrantyOverrideConfirmed : null,
        // ===== NEW: Repair type and service catalog =====
        repairType: repairType,
        serviceCatalogItems: serviceCatalogItems,
        // Round to 2 decimal places to match database precision (12,2)
        // For EVM_REPAIR: include totalServiceCost if service catalog items are used
        totalServiceCost: repairType === 'SC_REPAIR' 
          ? Math.round((totalServiceCost || 0) * 100) / 100 
          : (repairType === 'EVM_REPAIR' && serviceCatalogItems && serviceCatalogItems.length > 0
              ? Math.round((totalServiceCost || 0) * 100) / 100
              : null),
        // ===== NEW: Third party parts cost totals (for SC Repair) =====
        totalThirdPartyPartsCost: repairType === 'SC_REPAIR' 
          ? Math.round((requiredParts
              .filter(p => p.thirdPartyPartId)
              .reduce((sum, p) => sum + (p.totalPrice || 0), 0)) * 100) / 100
          : null,
        totalEstimatedCost: repairType === 'SC_REPAIR'
          ? Math.round((totalServiceCost + requiredParts
              .filter(p => p.thirdPartyPartId)
              .reduce((sum, p) => sum + (p.totalPrice || 0), 0)) * 100) / 100
          : null,
        partsUsed: partsUsed, 
        attachmentPaths: attachmentPaths, 
        diagnosticImages: [], 
      };

      const response = await axios.put(
        `${process.env.REACT_APP_API_URL}/api/claims/${claimId}/diagnostic`,
        payload,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      if (response.status === 200 || response.status === 201) {
        toast.success(`Chẩn đoán cho yêu cầu ${claim.claimNumber} đã được cập nhật và gửi thành công!`);
        handleBackClick(); 
      } else {
        toast.info(`Cập nhật chẩn đoán thành công với mã trạng thái: ${response.status}`);
        handleBackClick();
      }

    } catch (error) {
      let errorMessage = 'Đã xảy ra lỗi khi cập nhật chẩn đoán.';
      if (error.response) {
        errorMessage = error.response.data?.message || `Lỗi: ${error.response.status} - ${error.response.statusText}`;
      } else if (error.request) {
        errorMessage = 'Không có phản hồi từ máy chủ. Kiểm tra kết nối mạng.';
      } else {
        errorMessage = error.message;
      }
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Rendering Helper: Combine files for display (UNMODIFIED) ---
  const filesToRender = [
      ...existingAttachments.map(att => ({ 
          id: att.id,
          name: att.originalFileName || att.fileName || att.filePath?.split('/').pop() || 'Unknown', 
          status: 'uploaded',
          attachment: att // Store full attachment object for download
      })),
      ...uploadingFiles.map(name => ({ 
          id: `temp-${name}`, 
          name, 
          status: 'uploading' 
      }))
  ];


  if (loading) {
    return (
      <div className="udp-page-wrapper">
        <div className="udp-loading-message">Đang tải chi tiết yêu cầu...</div>
      </div>
    );
  }
  
  const user = JSON.parse(localStorage.getItem('user'));
  const isAssigned = claim.assignedTechnician && claim.assignedTechnician.id === user.userId;
  
  if (!isAssigned) {
      return (
          <div className="udp-page-wrapper">
              <div className="udp-error-message">
                  <FaExclamationTriangle className="udp-warning-icon" />
                  Yêu cầu này hiện không được phân công cho bạn. Không được phép cập nhật chẩn đoán.
              </div>
              <div className="udp-back-container">
                  <button onClick={handleBackClick} className="udp-back-button">
                      ← Quay lại Chi tiết Yêu cầu
                  </button>
              </div>
          </div>
      );
  }


  return (
    <motion.div
      className="udp-page-wrapper"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="udp-page-header">
        <button onClick={handleBackClick} className="udp-back-button">
          ← Quay lại Chi tiết Yêu cầu
        </button>
        <h2 className="udp-page-title">
          Cập nhật Chẩn đoán - Yêu cầu {claim.claimNumber}
        </h2>
      </div>

      <div className="udp-content-area">
        <motion.form 
          onSubmit={handleSubmitDiagnostic}
          className="udp-form-grid"
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
        >
          {/* ===== NEW: Repair Type Selection ===== */}
          <motion.div className="udp-form-section udp-full-width" variants={{ hidden: { opacity: 0, y: -20 }, visible: { opacity: 1, y: 0 } }}>
            <h3 className="udp-section-title">Loại Sửa chữa</h3>
            <div className="udp-form-group">
              <label>Chọn loại sửa chữa *</label>
              {/* ===== NEW: Check if claim has been denied twice and reopened - only show SC_REPAIR ===== */}
              {(() => {
                const isDoubleRejectedAndReopened = 
                  claim?.status === 'OPEN' && 
                  ((claim?.rejectionCount !== null && claim?.rejectionCount !== undefined && claim.rejectionCount >= 2) ||
                   (claim?.canResubmit === false && claim?.resubmitCount !== null && claim?.resubmitCount !== undefined && claim.resubmitCount >= 1));
                
                if (isDoubleRejectedAndReopened) {
                  // Only show SC_REPAIR option for double-rejected and reopened claims
                  return (
                    <div className="udp-radio-group">
                      <div className="udp-info-message">
                        <strong>Lưu ý:</strong> Yêu cầu bảo hành này đã bị từ chối hai lần. Chỉ có thể chọn SC Repair (Khách hàng tự chi trả).
                      </div>
                      <label className="udp-radio-label">
                        <input
                          type="radio"
                          name="repairType"
                          value="SC_REPAIR"
                          checked={repairType === 'SC_REPAIR'}
                          onChange={(e) => setRepairType(e.target.value)}
                          disabled
                        />
                        <span>SC Repair (Khách hàng tự chi trả)</span>
                      </label>
                    </div>
                  );
                }
                
                // Normal case: show both options
                return (
                  <div className="udp-radio-group">
                    <label className="udp-radio-label">
                      <input
                        type="radio"
                        name="repairType"
                        value="EVM_REPAIR"
                        checked={repairType === 'EVM_REPAIR'}
                        onChange={(e) => {
                          setRepairType(e.target.value);
                          // Cannot switch from SC_REPAIR to EVM_REPAIR if already SC_REPAIR
                          if (claim?.repairType === 'SC_REPAIR' && e.target.value === 'EVM_REPAIR') {
                            toast.error('Không thể chuyển từ SC Repair sang EVM Repair. Vui lòng hủy claim và tạo mới.');
                            setRepairType('SC_REPAIR');
                            return;
                          }
                        }}
                      />
                      <span>EVM Repair (Bảo hành - EVM chi trả dịch vụ, phụ tùng miễn phí)</span>
                    </label>
                    <label className="udp-radio-label">
                      <input
                        type="radio"
                        name="repairType"
                        value="SC_REPAIR"
                        checked={repairType === 'SC_REPAIR'}
                        onChange={(e) => setRepairType(e.target.value)}
                      />
                      <span>SC Repair (Khách hàng tự chi trả)</span>
                    </label>
                  </div>
                );
              })()}
            </div>
          </motion.div>

          {/* ===== NEW: Warranty Eligibility Assessment (Only for EVM_REPAIR) ===== */}
          {repairType === 'EVM_REPAIR' && (
            <motion.div className="udp-form-section udp-full-width" variants={{ hidden: { opacity: 0, y: -20 }, visible: { opacity: 1, y: 0 } }}>
              <h3 className="udp-section-title">Đánh giá Điều kiện Bảo hành</h3>
              
              {/* ===== NEW: Automatic Warranty Check Results ===== */}
              {warrantyCheckResult === 'checking' && (
                <div className="udp-warranty-check-message udp-warranty-check-checking">
                  <p>Đang kiểm tra điều kiện bảo hành tự động...</p>
                </div>
              )}
              
              {warrantyCheckResult === 'pass' && (
                <div className="udp-warranty-check-message udp-warranty-check-pass">
                  <h4>✅ Đủ điều kiện bảo hành</h4>
                  <ul>
                    {warrantyCheckReasons.map((reason, idx) => (
                      <li key={idx}>{reason}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {warrantyCheckResult === 'no_constraints' && (
                <div className="udp-warranty-check-message udp-warranty-check-no-constraints">
                  <h4>⚠ Không tìm thấy điều kiện bảo hành cho mẫu xe này</h4>
                  <p>Vui lòng nhập thủ công thông tin điều kiện bảo hành.</p>
                </div>
              )}
              
              {warrantyCheckResult === 'fail' && (
                <div className="udp-warranty-check-message udp-warranty-check-fail">
                  <h4>✗ Xe không đủ điều kiện bảo hành</h4>
                  <ul>
                    {warrantyCheckReasons.map((reason, idx) => (
                      <li key={idx}>{reason}</li>
                    ))}
                  </ul>
                  <p style={{ marginTop: '1rem', fontWeight: 'bold' }}>
                    Tiếp tục với luồng SC Repair hoặc Hủy Claim.
                  </p>
                </div>
              )}
              
              {/* ===== Show manual input fields always (allow manual override even when check fails) ===== */}
              {/* Disable when check passes (auto-filled) or when check fails without override confirmation */}
              {(() => {
                // Disable assessment and eligibility fields when check passes or fails without override
                const shouldDisableAssessmentFields = 
                  warrantyCheckResult === 'pass' || 
                  (warrantyCheckResult === 'fail' && !warrantyOverrideConfirmed);
                
                // Notes field is always editable (never disabled)
                const shouldDisableNotes = false;
                
                return (
                  <div className={`udp-warranty-manual-inputs ${shouldDisableAssessmentFields ? 'udp-form-disabled' : ''}`}>
                    <div className="udp-form-group">
                      <label htmlFor="warrantyEligibilityAssessment">Điều kiện bảo hành được chấp nhận *</label>
                      <textarea
                        id="warrantyEligibilityAssessment"
                        value={warrantyEligibilityAssessment}
                        onChange={(e) => setWarrantyEligibilityAssessment(e.target.value)}
                        placeholder="Nhập đánh giá về điều kiện bảo hành của xe trong claim..."
                        required
                        rows="4"
                        disabled={shouldDisableAssessmentFields}
                      />
                    </div>
                    <div className="udp-inline-group">
                      <div className="udp-form-group">
                        <label>Xe có đủ điều kiện bảo hành? *</label>
                        <div className="udp-radio-group">
                          <label className="udp-radio-label">
                            <input
                              type="radio"
                              name="isWarrantyEligible"
                              value="true"
                              checked={isWarrantyEligible === true}
                              onChange={() => setIsWarrantyEligible(true)}
                              disabled={shouldDisableAssessmentFields}
                            />
                            <span>Có</span>
                          </label>
                          <label className="udp-radio-label">
                            <input
                              type="radio"
                              name="isWarrantyEligible"
                              value="false"
                              checked={isWarrantyEligible === false}
                              onChange={() => setIsWarrantyEligible(false)}
                              disabled={shouldDisableAssessmentFields}
                            />
                            <span>Không</span>
                          </label>
                        </div>
                      </div>
                    </div>
                    <div className="udp-form-group">
                      <label htmlFor="warrantyEligibilityNotes">Ghi chú về điều kiện bảo hành</label>
                      <textarea
                        id="warrantyEligibilityNotes"
                        value={warrantyEligibilityNotes}
                        onChange={(e) => setWarrantyEligibilityNotes(e.target.value)}
                        placeholder="Ghi chú bổ sung..."
                        rows="3"
                        disabled={shouldDisableNotes}
                      />
                    </div>
                  </div>
                );
              })()}
            </motion.div>
          )}

          {/* ===== NEW: Customer Action Prompt Modal ===== */}
          {showCustomerActionPrompt && warrantyCheckResult === 'fail' && (
            <motion.div 
              className="udp-customer-action-modal-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={() => setShowCustomerActionPrompt(false)}
            >
              <motion.div 
                className="udp-customer-action-modal"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                onClick={(e) => e.stopPropagation()}
              >
                <h3>Xe không đủ điều kiện bảo hành</h3>
                <p>{customerActionDescription}</p>
                <div className="udp-customer-action-buttons">
                  <button
                    type="button"
                    onClick={handleUpdateStatusToCustomerAction}
                    className="udp-btn-primary"
                  >
                    Cập nhật trạng thái: Cần Hành động Khách hàng
                  </button>
                  <button
                    type="button"
                    onClick={handleMoveOnSCRepair}
                    className="udp-btn-secondary"
                  >
                    Tiếp tục với SC Repair
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelClaim}
                    className="udp-btn-danger"
                  >
                    Hủy Claim
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCustomerActionPrompt(false)}
                    className="udp-btn-cancel"
                  >
                    Đóng
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
          
          {/* Main Diagnostic Fields (Full Width) - Disable if warranty check failed and not overridden */}
          <motion.div 
            className={`udp-form-section udp-full-width ${warrantyCheckResult === 'fail' && !warrantyOverrideConfirmed ? 'udp-form-disabled' : ''}`}
            variants={{ hidden: { opacity: 0, y: -20 }, visible: { opacity: 1, y: 0 } }}
          >
            <h3 className="udp-section-title">Tóm tắt Chẩn đoán & Ghi chú</h3>
            
            {/* Reported Failure Description - Required when readyForSubmission is true */}
            <div className="udp-form-group">
              <label htmlFor="reportedFailure">
                Mô tả Lỗi Đã Báo cáo {readyForSubmission && <span style={{ color: '#ff4444', marginLeft: '0.25rem' }}>*</span>}
              </label>
                  <textarea
                id="reportedFailure"
                value={reportedFailure}
                onChange={(e) => setReportedFailure(e.target.value)}
                placeholder="Mô tả chi tiết lỗi đã được báo cáo bởi khách hàng (tối thiểu 10 ký tự khi chọn 'Sẵn sàng Gửi')"
                rows="4"
                required={readyForSubmission}
                minLength={readyForSubmission ? 10 : undefined}
                disabled={warrantyCheckResult === 'fail' && !warrantyOverrideConfirmed}
              />
              {readyForSubmission && reportedFailure && reportedFailure.trim().length < 10 && (
                <p className="udp-error-text" style={{ color: '#ff4444', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                  Mô tả lỗi phải có ít nhất 10 ký tự.
                </p>
              )}
            </div>
            
            {/* Summary and Initial Diagnosis (Inline group) */}
            <div className="udp-inline-group">
                {/* Diagnostic Summary */}
                <div className="udp-form-group">
                  <label htmlFor="diagnosticSummary">Tóm tắt Chẩn đoán *</label>
                  <input
                    id="diagnosticSummary"
                    type="text"
                    value={diagnosticSummary}
                    onChange={(e) => setDiagnosticSummary(e.target.value)}
                    placeholder="e.g., BMS lỗi, pin không nhận sạc"
                    required
                    disabled={warrantyCheckResult === 'fail' && !warrantyOverrideConfirmed}
                  />
                </div>

                {/* Initial Diagnosis */}
                <div className="udp-form-group">
                  <label htmlFor="initialDiagnosis">Chẩn đoán Ban đầu *</label>
                  <input
                    id="initialDiagnosis"
                    type="text"
                    value={initialDiagnosis}
                    onChange={(e) => setInitialDiagnosis(e.target.value)}
                    placeholder="ví dụ: Nghi ngờ lỗi bộ pin"
                    required
                    disabled={warrantyCheckResult === 'fail' && !warrantyOverrideConfirmed}
                  />
                </div>
            </div>

            {/* Test Results & Repair Notes (Stacked, full width) */}
            <div className="udp-inline-group">
                {/* Test Results */}
                <div className="udp-form-group">
                  <label htmlFor="testResults">Kết quả Kiểm tra *</label>
                  <textarea
                    id="testResults"
                    value={testResults}
                    onChange={(e) => setTestResults(e.target.value)}
                    placeholder="ví dụ: OCV thấp, mất cân bằng cell 40mV"
                    required
                    rows="3"
                    disabled={warrantyCheckResult === 'fail' && !warrantyOverrideConfirmed}
                  />
                </div>
                
                {/* Repair Notes */}
                <div className="udp-form-group">
                  <label htmlFor="repairNotes">Ghi chú Sửa chữa *</label>
                  <textarea
                    id="repairNotes"
                    value={repairNotes}
                    onChange={(e) => setRepairNotes(e.target.value)}
                    placeholder="ví dụ: Đề xuất thay bộ pin"
                    required
                    rows="3"
                    disabled={warrantyCheckResult === 'fail' && !warrantyOverrideConfirmed}
                  />
                </div>
            </div>

            {/* Full Diagnostic Details */}
            <div className="udp-form-group">
              <label htmlFor="diagnosticDetails">Chi tiết Chẩn đoán (Báo cáo Đầy đủ) *</label>
              <textarea
                id="diagnosticDetails"
                value={diagnosticDetails}
                onChange={(e) => setDiagnosticDetails(e.target.value)}
                placeholder="ví dụ: Các bước chi tiết đã thực hiện cho chẩn đoán và phát hiện đầy đủ..."
                required
                rows="6"
                disabled={warrantyCheckResult === 'fail' && !warrantyOverrideConfirmed}
              />
            </div>

          </motion.div>

          {/* Media Attachment Component (Full Width) - Disable if warranty check failed and not overridden */}
          <motion.div
            className={`udp-form-section udp-full-width ${warrantyCheckResult === 'fail' && !warrantyOverrideConfirmed ? 'udp-form-disabled' : ''}`}
            variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
          >
            <h3 className="udp-section-title">Tệp đính kèm Phương tiện</h3> 
            
            <input 
                type="file"
                ref={fileInputRef}
                multiple
                onChange={handleFileChange}
                style={{ display: 'none' }} // Hide native input
                id="file-upload"
            />
            
            {/* Custom Upload Button */}
            <button 
                type="button" 
                className="udp-add-part-btn"
                onClick={() => fileInputRef.current && fileInputRef.current.click()}
                disabled={isSubmitting || (warrantyCheckResult === 'fail' && !warrantyOverrideConfirmed)} // Disable file select if main form is submitting or warranty check failed
            >
                <FaUpload /> Chọn Tệp để Tải lên
            </button>
            
            {/* File List Display */}
            <div className="udp-file-list">
                
                {filesToRender.map((file) => (
                    <div 
                        key={file.id || file.name} 
                        className={`udp-file-item ${file.status === 'uploaded' ? 'udp-existing-file' : 'udp-uploading-file'}`}
                    >
                        {file.status === 'uploading' ? (
                            <FaUpload className="udp-file-icon udp-icon-spin" />
                        ) : (
                            <FaFileAlt className="udp-file-icon" />
                        )}
                        
                        <span 
                            className={`udp-file-name ${file.status === 'uploaded' ? 'udp-download-link' : ''}`}
                            onClick={file.status === 'uploaded' ? () => handleDownloadAttachment(file.attachment) : null} 
                            title={file.status === 'uploaded' ? `Nhấp để tải xuống ${file.name}` : file.name}
                        >
                            {file.name}
                        </span>

                        {/* Status Badge */}
                        <span className="udp-file-status">
                            {file.status === 'uploaded' ? 'Đã tải lên' : 'Đang tải lên...'}
                        </span>

                        {/* Remove/Delete Button */}
                        <button 
                            type="button" 
                            onClick={file.status === 'uploaded' ? () => handleDeleteAttachment(file.id) : null}
                            className="udp-file-remove-btn"
                            title={file.status === 'uploaded' ? 'Xóa Tệp' : 'Không thể xóa trong khi tải lên'}
                            disabled={!file.id || isSubmitting} // Disable if no ID (means it's uploading) or submitting main form
                        >
                            <FaTimesCircle />
                        </button>
                    </div>
                ))}
                
                {/* Placeholder if no files are present/queued */}
                {filesToRender.length === 0 && (
                    <div className="udp-placeholder-box udp-file-info-box">
                        <p>Hiện không có tệp phương tiện nào được đính kèm hoặc được chọn để tải lên.</p>
                    </div>
                )}
            </div>
          </motion.div>

          {/* ===== NEW: Service Catalog (Don gia) Section - For both EVM and SC Repair ===== */}
          <motion.div 
            className={`udp-form-section udp-full-width ${warrantyCheckResult === 'fail' && !warrantyOverrideConfirmed ? 'udp-form-disabled' : ''}`}
            variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
          >
              <h3 className="udp-section-title">Đơn giá (Dịch vụ) *</h3>
              <div className="udp-service-catalog-section">
                {/* Labor Hours Field - Auto-calculated from services */}
                <div className="udp-form-group">
                  <label htmlFor="laborHours">Giờ Lao động *</label>
                  <input
                    id="laborHours"
                    type="number"
                    step="0.1"
                    value={laborHours}
                    onChange={(e) => {
                      // Only allow manual editing if no services are selected
                      if (serviceCatalogItems.length === 0) {
                        setLaborHours(e.target.value);
                      }
                    }}
                    placeholder="2.5"
                    required
                    readOnly={serviceCatalogItems.length > 0 || (warrantyCheckResult === 'fail' && !warrantyOverrideConfirmed)}
                    disabled={warrantyCheckResult === 'fail' && !warrantyOverrideConfirmed}
                    className={serviceCatalogItems.length > 0 ? 'udp-readonly-input' : ''}
                  />
                  {serviceCatalogItems.length > 0 ? (
                    <small style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.25rem', display: 'block' }}>
                      Tự động tính từ các dịch vụ đã chọn
                    </small>
                  ) : (
                    <small style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.25rem', display: 'block' }}>
                      Nhập thủ công hoặc thêm dịch vụ để tự động tính
                    </small>
                  )}
                </div>
                {/* Service Items List */}
                <div className="udp-service-items-list">
                  {serviceCatalogItems.map((item, index) => (
                    <div key={index} className="udp-service-item">
                      <div className="udp-form-group">
                        <label>Dịch vụ</label>
                        <input
                          type="text"
                          value={item.serviceItemName}
                          readOnly
                          className="udp-readonly-input"
                        />
                      </div>
                      <div className="udp-form-group">
                        <label>Giờ lao động</label>
                        <div className="udp-labor-hours-display">
                          <span className="udp-labor-hours-value">
                            {((parseFloat(item.standardLaborHours || 0) * parseInt(item.quantity || 1)).toFixed(1))} giờ
                          </span>
                          <span className="udp-labor-hours-breakdown-text">({item.standardLaborHours || 0} × {item.quantity || 1})</span>
                        </div>
                      </div>
                      <div className="udp-form-group">
                        <label>Đơn giá (₫)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(e) => handleUpdateServiceItem(index, 'unitPrice', e.target.value)}
                          required
                          disabled={warrantyCheckResult === 'fail' && !warrantyOverrideConfirmed}
                        />
                      </div>
                      <div className="udp-form-group">
                        <label>Số lượng</label>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleUpdateServiceItem(index, 'quantity', e.target.value)}
                          required
                          disabled={warrantyCheckResult === 'fail' && !warrantyOverrideConfirmed}
                        />
                      </div>
                      <div className="udp-form-group">
                        <label>Thành tiền (₫)</label>
                        <input
                          type="text"
                          value={item.totalPrice.toLocaleString('vi-VN')}
                          readOnly
                          className="udp-readonly-input"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveServiceItem(index)}
                        className="udp-remove-part-btn"
                        title="Xóa Dịch vụ"
                        disabled={warrantyCheckResult === 'fail' && !warrantyOverrideConfirmed}
                      >
                        <FaTrash />
                      </button>
                    </div>
                  ))}
                </div>
                
                {/* Add Service Button with Search */}
                <div className="udp-add-service-section">
                  <div className="udp-service-search-container">
                    <input
                      type="text"
                      id="service-search"
                      placeholder="Tìm kiếm dịch vụ..."
                      className="udp-service-search-input"
                      value={serviceSearchQuery}
                      onChange={(e) => {
                        setServiceSearchQuery(e.target.value);
                        if (e.target.value.length >= 2) {
                          setShowServiceSearchResults(true);
                        }
                      }}
                      onFocus={() => {
                        if (serviceSearchResults.length > 0) {
                          setShowServiceSearchResults(true);
                        }
                      }}
                      onBlur={() => {
                        setTimeout(() => {
                          setShowServiceSearchResults(false);
                        }, 200);
                      }}
                      disabled={warrantyCheckResult === 'fail' && !warrantyOverrideConfirmed}
                    />
                    {showServiceSearchResults && serviceSearchQuery.length >= 2 && (
                      <div className="udp-service-search-results show">
                        {serviceSearchLoading ? (
                          <div className="udp-service-search-result-item">
                            <p>Đang tìm kiếm...</p>
                          </div>
                        ) : serviceSearchResults.length > 0 ? (
                          serviceSearchResults.map((item) => (
                            <div
                              key={item.id}
                              className="udp-service-search-result-item"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                handleAddServiceItem(item);
                                setServiceSearchQuery('');
                                setShowServiceSearchResults(false);
                                setServiceSearchResults([]);
                              }}
                            >
                              <p><strong>{item.name}</strong></p>
                              <p>Code: {item.serviceCode}</p>
                              {item.currentPrice && (
                                <p>Giá: {item.currentPrice.toLocaleString('vi-VN')} ₫</p>
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="udp-service-search-result-item">
                            <p>Không tìm thấy dịch vụ.</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Total Service Cost */}
                <div className="udp-total-costs-section">
                  <div className="udp-total-cost-item">
                    <label>Tổng chi phí cho dịch vụ sửa chữa:</label>
                    <div className="udp-total-cost-display">
                      <strong>{totalServiceCost.toLocaleString('vi-VN')} ₫</strong>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

          {/* Required Parts (Section 2 - Full Width) - Disable if warranty check failed and not overridden */}
          <motion.div 
            className={`udp-form-section udp-full-width ${warrantyCheckResult === 'fail' && !warrantyOverrideConfirmed ? 'udp-form-disabled' : ''}`}
            variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
          >
             <h3 className="udp-section-title">
               Phụ tùng Bắt buộc {partDataLoading && ' (Đang tải Danh mục...)'}
               {repairType === 'SC_REPAIR' && ' (Với giá phụ tùng bên thứ 3)'}
             </h3>
            <div className="udp-parts-list" onClick={(e) => e.stopPropagation()}>
              {requiredParts.map((part, index) => (
                <div key={index} className={`udp-part-item ${repairType === 'SC_REPAIR' ? 'udp-third-party-part-item' : ''}`}>
                  
                  {/* Part Name Search - Different for EVM vs Third Party */}
                  {repairType === 'SC_REPAIR' ? (
                    // SC_REPAIR: Always use Third Party Parts search with API
                    <>
                      <div className="udp-form-group part-name-group udp-search-container">
                        <label>Tên Phụ tùng / Tìm kiếm *</label>
                        <input
                          type="text"
                          value={part.searchQuery || part.partName || ''}
                          onChange={(e) => {
                            const query = e.target.value;
                            const newParts = [...requiredParts];
                            newParts[index].searchQuery = query;
                            setRequiredParts(newParts);
                            setThirdPartyPartSearchQuery(query);
                          }}
                          onFocus={() => {
                            if (thirdPartyPartSearchResults.length > 0 && thirdPartyPartSearchQuery.length >= 2) {
                              setShowThirdPartyPartSearchResults(true);
                            }
                          }}
                          onBlur={() => {
                            setTimeout(() => {
                              setShowThirdPartyPartSearchResults(false);
                            }, 200);
                          }}
                          placeholder="Tìm kiếm phụ tùng bên thứ 3..."
                          required
                          autoComplete="off"
                          disabled={warrantyCheckResult === 'fail' && !warrantyOverrideConfirmed}
                        />
                        {showThirdPartyPartSearchResults && thirdPartyPartSearchQuery.length >= 2 && (
                          <div className="udp-search-results">
                            {thirdPartyPartSearchLoading ? (
                              <div className="udp-search-result-item">
                                <p>Đang tìm kiếm...</p>
                              </div>
                            ) : thirdPartyPartSearchResults.length > 0 ? (
                              thirdPartyPartSearchResults.map((result) => (
                                <div
                                  key={result.id}
                                  className="udp-search-result-item"
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    // Update the current row (at index) with the selected part
                                    handleAddThirdPartyPart(result, 1, index);
                                    setThirdPartyPartSearchQuery('');
                                    setShowThirdPartyPartSearchResults(false);
                                    setThirdPartyPartSearchResults([]);
                                  }}
                                >
                                  <p><strong>{result.name}</strong></p>
                                  <p>Mã: {result.partNumber || 'N/A'}</p>
                                  <p>
                                    Giá: {(result.effectivePrice || result.catalogPrice || result.unitCost || 0).toLocaleString('vi-VN')} ₫
                                    {result.catalogPrice && result.catalogPrice !== result.unitCost && (
                                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginLeft: '0.5rem' }}>
                                        (Từ bảng giá)
                                      </span>
                                    )}
                                  </p>
                                </div>
                              ))
                            ) : (
                              <div className="udp-search-result-item">
                                <p>Không tìm thấy phụ tùng.</p>
                              </div>
                            )}
                          </div>
                        )}
                        {/* Status message for this part */}
                        {part.thirdPartyPartId && part.serialStatus && partSerialStatus[part.thirdPartyPartId] && (
                          <div className={`udp-part-status-message udp-status-${part.serialStatus.toLowerCase()}`}>
                            {partSerialStatus[part.thirdPartyPartId].message}
                          </div>
                        )}
                      </div>
                      
                      {/* Third Party Part ID (always show, auto-filled when part selected) */}
                      <div className="udp-form-group part-id-group">
                        <label>ID Phụ tùng {part.thirdPartyPartId && '*'}</label>
                        <input
                          type="number"
                          value={part.thirdPartyPartId || ''}
                          readOnly
                          className="udp-readonly-input"
                          placeholder="Chọn phụ tùng..."
                          disabled={!part.thirdPartyPartId}
                        />
                      </div>
                      
                      {/* Price field - Always show for SC_REPAIR */}
                      <div className="udp-form-group part-price-group">
                        <label>Đơn giá (₫) *</label>
                        <input
                          type="number"
                          step="0.01"
                          value={part.unitPrice || ''}
                          onChange={(e) => handleUpdateThirdPartyPartPrice(index, e.target.value)}
                          placeholder="0.00"
                          required
                          min="0"
                          disabled={warrantyCheckResult === 'fail' && !warrantyOverrideConfirmed}
                        />
                        {part.unitPrice && part.unitPrice > 0 && (
                          <small style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.25rem', display: 'block' }}>
                            {part.thirdPartyPartId ? 'Giá từ bảng giá catalog' : 'Nhập giá phụ tùng'}
                          </small>
                        )}
                      </div>
                    </>
                  ) : (
                    // EVM_REPAIR: Original EVM Parts search
                    <>
                      <div className="udp-form-group part-name-group udp-search-container">
                        <label>Tên Phụ tùng / Tìm kiếm *</label> 
                        <input
                          type="text"
                          value={part.searchQuery} 
                          onChange={(e) => handlePartChange(index, 'searchQuery', e.target.value)}
                          onFocus={() => handleInputFocus(index)}
                          onBlur={() => handleInputBlur(index)}
                          placeholder="ví dụ: Cảm biến Nhiệt độ Pin"
                          required
                          autoComplete="off"
                          disabled={warrantyCheckResult === 'fail' && !warrantyOverrideConfirmed}
                        />
                        {part.showResults && part.searchQuery.length > 0 && (
                            <div className="udp-search-results">
                                {part.searchResults.length > 0 ? (
                                    part.searchResults.map((result) => (
                                        <div
                                            key={`${result.partId}-${result.partNumber}`}
                                            className="udp-search-result-item"
                                            onMouseDown={(e) => { e.preventDefault(); handlePartSelect(index, result); }} 
                                        >
                                            <p><strong>{result.partName}</strong></p>
                                            <p>ID: {result.partId} | Number: {result.partNumber}</p>
                                        </div>
                                    ))
                                ) : (
                                    <div className="udp-search-result-item">
                                        <p>Không tìm thấy phụ tùng.</p>
                                    </div>
                                )}
                            </div>
                        )}
                      </div>
                      
                      <div className="udp-form-group part-id-group">
                        <label>ID Phụ tùng *</label> 
                        <input
                          type="number"
                          value={part.partId}
                          onChange={(e) => handlePartChange(index, 'partId', e.target.value)}
                          placeholder="e.g., 6"
                          required
                          min="1"
                          disabled={warrantyCheckResult === 'fail' && !warrantyOverrideConfirmed}
                        />
                      </div>
                    </>
                  )}
                  
                  <div className="udp-form-group part-quantity-group">
                    <label>Số lượng *</label>
                    <input
                      type="number"
                      min="1"
                      value={part.quantity}
                      onChange={async (e) => {
                        const newQuantity = Math.max(1, parseInt(e.target.value, 10) || 1);
                        if (part.thirdPartyPartId) {
                          // For third-party parts, check and reserve serials
                          await handleUpdateThirdPartyPartQuantity(index, newQuantity);
                        } else {
                          // For regular parts, just update quantity
                          const newParts = [...requiredParts];
                          newParts[index].quantity = newQuantity;
                          setRequiredParts(newParts);
                        }
                      }}
                      placeholder="1"
                      required
                      disabled={warrantyCheckResult === 'fail' && !warrantyOverrideConfirmed}
                    />
                  </div>
                  
                  {/* Total Price for Third Party Parts */}
                  {part.thirdPartyPartId && (
                    <div className="udp-form-group part-total-group">
                      <label>Thành tiền (₫)</label>
                      <input
                        type="text"
                        value={(part.totalPrice || 0).toLocaleString('vi-VN')}
                        readOnly
                        className="udp-readonly-input"
                      />
                    </div>
                  )}
                  
                  <button
                    type="button"
                    onClick={() => handleRemovePart(index)}
                    className="udp-remove-part-btn"
                    title="Xóa Phụ tùng"
                    disabled={warrantyCheckResult === 'fail' && !warrantyOverrideConfirmed}
                  >
                    <FaTrash />
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={handleAddPart}
              className="udp-add-part-btn"
              disabled={partDataLoading || (warrantyCheckResult === 'fail' && !warrantyOverrideConfirmed)}
            >
              <FaPlus /> Thêm Phụ tùng
            </button>
            
            {/* Total Cost Fields - Only for SC Repair */}
            {repairType === 'SC_REPAIR' && (() => {
              const totalThirdPartyPartsCost = requiredParts
                .filter(p => p.thirdPartyPartId)
                .reduce((sum, p) => sum + (p.totalPrice || 0), 0);
              const totalEstimatedCost = totalServiceCost + totalThirdPartyPartsCost;
              
              return (
                <div className="udp-total-costs-section">
                  {/* Total Third Party Parts Cost */}
                  <div className="udp-total-cost-item">
                    <label>Tổng chi phí cho linh kiện bên thứ 3 thay thế:</label>
                    <div className="udp-total-cost-display">
                      <strong>
                        {totalThirdPartyPartsCost.toLocaleString('vi-VN')} ₫
                      </strong>
                    </div>
                  </div>
                  
                  {/* Combined Total with Breakdown */}
                  <div className="udp-total-cost-item udp-total-cost-item-combined">
                    <label>Tổng chi phí dự kiến:</label>
                    <div className="udp-total-cost-display udp-total-cost-display-combined">
                      <div className="udp-cost-breakdown">
                        <div className="udp-cost-breakdown-item">
                          <span className="udp-cost-breakdown-label">Chi phí dịch vụ:</span>
                          <span className="udp-cost-breakdown-value">{totalServiceCost.toLocaleString('vi-VN')} ₫</span>
                        </div>
                        <div className="udp-cost-breakdown-item">
                          <span className="udp-cost-breakdown-label">Chi phí phụ tùng bên thứ 3:</span>
                          <span className="udp-cost-breakdown-value">{totalThirdPartyPartsCost.toLocaleString('vi-VN')} ₫</span>
                        </div>
                        <div className="udp-cost-breakdown-item udp-cost-breakdown-total">
                          <span className="udp-cost-breakdown-label">Tổng cộng:</span>
                          <strong className="udp-cost-breakdown-value">{totalEstimatedCost.toLocaleString('vi-VN')} ₫</strong>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </motion.div>

          {/* Warranty Override Confirmation Checkbox (only shown when warranty check fails) */}
          {warrantyCheckResult === 'fail' && repairType === 'EVM_REPAIR' && (
            <motion.div 
              className="udp-form-section udp-full-width"
              variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
            >
              <div className="udp-form-group udp-checkbox-group">
                <label htmlFor="warrantyOverrideConfirmed">
                  <input
                    id="warrantyOverrideConfirmed"
                    type="checkbox"
                    checked={warrantyOverrideConfirmed}
                    onChange={(e) => setWarrantyOverrideConfirmed(e.target.checked)}
                  />
                  Bạn có chắc chắn những thông tin trên xe đáp ứng đầy đủ các điều kiện bảo hành của hãng đối với mẫu xe cho tới thời điểm hiện và đồng ý lưu thông tin? *
                </label>
                <p className="udp-checkbox-note">
                  Bằng cách chọn hộp này, bạn xác nhận rằng xe đáp ứng đầy đủ các điều kiện bảo hành và bạn chịu trách nhiệm về thông tin đã nhập.
                </p>
              </div>
            </motion.div>
          )}

          {/* Ready For Submission Checkbox (only for EVM Repair) - At bottom before submit */}
          {repairType === 'EVM_REPAIR' && (
          <motion.div 
            className="udp-form-section udp-full-width"
            variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
          >
            <div className="udp-form-group udp-checkbox-group">
              <label htmlFor="readyForSubmission">
                <input
                  id="readyForSubmission"
                  type="checkbox"
                  checked={readyForSubmission}
                  onChange={(e) => setReadyForSubmission(e.target.checked)}
                  disabled={warrantyCheckResult === 'fail' && !warrantyOverrideConfirmed}
                />
                Sẵn sàng Gửi *
              </label>
              <p className="udp-checkbox-note">Chọn hộp này để hoàn tất báo cáo chẩn đoán.</p>
            </div>
          </motion.div>
          )}

          {/* Submit Button (Full Width) - Disable if warranty check failed and not overridden */}
          <motion.div 
            className="udp-submit-area udp-full-width"
            variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
          >
            <button
              type="submit"
              className="udp-submit-button"
              disabled={
                isSubmitting || 
                partDataLoading || 
                uploadingFiles.length > 0 ||
                (warrantyCheckResult === 'fail' && !warrantyOverrideConfirmed)
              } 
            >
              <FaSave /> {isSubmitting ? 'Đang gửi...' : 'Gửi Chẩn đoán'}
            </button>
          </motion.div>
        </motion.form>
      </div>
    </motion.div>
  );
};

export default UpdateDiagnosticPage;