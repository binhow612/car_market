import React, { useState, useEffect } from 'react';
import { ValuationService, type ValuationRequest, type ValuationResponse } from '../services/valuation.service';
import { MetadataService } from '../services/metadata.service';

interface ValuationFormProps {
  initialMakes?: string[];
  onResult?: (result: ValuationResponse) => void;
}

export function ValuationForm({ initialMakes = [], onResult }: ValuationFormProps) {
  const [make, setMake] = useState<string>('');
  const [model, setModel] = useState<string>('');
  const [year, setYear] = useState<number | ''>('');
  const [version, setVersion] = useState<string>('');
  const [color, setColor] = useState<string>('');
  const [mileage, setMileage] = useState<number>(50000);
  
  // Dropdown data
  const [makes, setMakes] = useState<string[]>(initialMakes);
  const [models, setModels] = useState<string[]>([]);
  const [years, setYears] = useState<number[]>([]);
  const [versions, setVersions] = useState<string[]>([]);
  const [colors, setColors] = useState<string[]>([]);
  
  // Loading states
  const [loadingMakes, setLoadingMakes] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);
  const [loadingYears, setLoadingYears] = useState(false);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [loadingColors, setLoadingColors] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ValuationResponse | null>(null);

  // Load makes on mount if not provided
  useEffect(() => {
    if (makes.length === 0) {
      const loadMakes = async () => {
        try {
          setLoadingMakes(true);
          const data = await MetadataService.getValuationMakes();
          setMakes(data);
          if (data.length > 0) {
            setMake(data[0]);
          }
        } catch (err) {
          console.error('Failed to load makes:', err);
        } finally {
          setLoadingMakes(false);
        }
      };
      loadMakes();
    } else if (makes.length > 0 && !make) {
      setMake(makes[0]);
    }
  }, []);

  // Load models when make changes
  useEffect(() => {
    if (!make) {
      setModels([]);
      setModel('');
      return;
    }

    const loadModels = async () => {
      try {
        setLoadingModels(true);
        const data = await MetadataService.getValuationModels(make);
        setModels(data);
        setModel('');
        setYear('');
        setVersion('');
        setColor('');
        setYears([]);
        setVersions([]);
        setColors([]);
      } catch (err) {
        console.error('Failed to load models:', err);
        setModels([]);
      } finally {
        setLoadingModels(false);
      }
    };
    loadModels();
  }, [make]);

  // Load years when model changes
  useEffect(() => {
    if (!make || !model) {
      setYears([]);
      setYear('');
      return;
    }

    const loadYears = async () => {
      try {
        setLoadingYears(true);
        const data = await MetadataService.getValuationYears(make, model);
        setYears(data);
        setYear('');
        setVersion('');
        setColor('');
        setVersions([]);
        setColors([]);
      } catch (err) {
        console.error('Failed to load years:', err);
        setYears([]);
      } finally {
        setLoadingYears(false);
      }
    };
    loadYears();
  }, [make, model]);

  // Load versions when year changes
  useEffect(() => {
    if (!make || !model || !year) {
      setVersions([]);
      setVersion('');
      return;
    }

    const loadVersions = async () => {
      try {
        setLoadingVersions(true);
        const data = await MetadataService.getValuationVersions(make, model, year as number);
        setVersions(data);
        setVersion('');
        setColor('');
        setColors([]);
      } catch (err) {
        console.error('Failed to load versions:', err);
        setVersions([]);
      } finally {
        setLoadingVersions(false);
      }
    };
    loadVersions();
  }, [make, model, year]);

  // Load colors when version changes (or when year changes if no versions)
  useEffect(() => {
    if (!make || !model || !year) {
      setColors([]);
      setColor('');
      return;
    }

    const loadColors = async () => {
      try {
        setLoadingColors(true);
        const data = await MetadataService.getValuationColors(
          make,
          model,
          year as number,
          version || undefined
        );
        setColors(data);
        setColor('');
      } catch (err) {
        console.error('Failed to load colors:', err);
        setColors([]);
      } finally {
        setLoadingColors(false);
      }
    };
    loadColors();
  }, [make, model, year, version]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);

    if (!make || !model || !year) {
      setError('Vui lòng chọn ít nhất: Hãng xe, Model và Năm sản xuất');
      return;
    }

    // Version and color are optional in API, but required in form UI
    // We'll make them optional here for better UX
    if (versions.length > 0 && !version) {
      setError('Vui lòng chọn phiên bản xe');
      return;
    }

    if (colors.length > 0 && !color) {
      setError('Vui lòng chọn màu sắc');
      return;
    }

    setLoading(true);

    try {
      const request: ValuationRequest = {
        brand: make,
        model,
        year: year as number,
        mileage_km: mileage,
        version: version || undefined,
        color: color || undefined,
      };

      const data = await ValuationService.estimatePrice(request);
      setResult(data);
      
      // Call onResult callback if provided
      if (onResult) {
        onResult(data);
      }
    } catch (err: any) {
      const errorMsg = err?.response?.data?.detail || err?.response?.data?.message || 'Không thể định giá xe, vui lòng thử lại.';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-3 space-y-3">
      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Make */}
        <div>
          <label className="block text-xs font-medium mb-1 text-gray-700">Hãng xe *</label>
          <select
            value={make}
            onChange={(e) => setMake(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            required
            disabled={loadingMakes}
          >
            <option value="">-- Chọn hãng --</option>
            {makes.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        {/* Model */}
        <div>
          <label className="block text-xs font-medium mb-1 text-gray-700">Model *</label>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            required
            disabled={!make || loadingModels}
          >
            <option value="">-- Chọn model --</option>
            {models.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        {/* Year and Mileage */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-medium mb-1 text-gray-700">Năm *</label>
            <select
              value={year}
              onChange={(e) => setYear(e.target.value ? Number(e.target.value) : '')}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              required
              disabled={!model || loadingYears}
            >
              <option value="">-- Năm --</option>
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1 text-gray-700">Số km *</label>
            <input
              type="number"
              value={mileage}
              onChange={(e) => setMileage(Number(e.target.value))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              min={0}
              required
            />
          </div>
        </div>

        {/* Version */}
        {versions.length > 0 && (
          <div>
            <label className="block text-xs font-medium mb-1 text-gray-700">
              Phiên bản *
            </label>
            <select
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              disabled={!year || loadingVersions}
              required
            >
              <option value="">-- Chọn phiên bản --</option>
              {versions.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Color */}
        {colors.length > 0 && (
          <div>
            <label className="block text-xs font-medium mb-1 text-gray-700">
              Màu sắc *
            </label>
            <select
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              disabled={!year || loadingColors}
              required
            >
              <option value="">-- Chọn màu --</option>
              {colors.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full bg-black hover:bg-gray-800 text-white text-sm font-medium rounded-lg px-4 py-2.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={loading || !make || !model || !year || (versions.length > 0 && !version) || (colors.length > 0 && !color)}
        >
          {loading ? 'Đang tính toán...' : 'Định giá'}
        </button>
      </form>

      {/* Result Display */}
      {result && (
        <div className="mt-4 border-t border-gray-200 pt-3 space-y-2">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-3 border border-blue-200">
            <div className="text-center mb-2">
              <p className="text-xs text-gray-600 mb-1">💰 Giá ước tính</p>
              <p className="text-xl font-bold text-blue-600">
                {Math.round(result.price_estimate).toLocaleString('en-US')} triệu VNĐ
              </p>
            </div>
            
            <div className="text-xs text-gray-600 mb-1">📊 Khoảng giá:</div>
            <p className="text-sm font-semibold text-gray-800">
              {Math.round(result.price_min).toLocaleString('en-US')} - {Math.round(result.price_max).toLocaleString('en-US')} triệu VNĐ
            </p>

            {result.confidence_level && (
              <div className="mt-2 text-xs">
                <span className="text-gray-600">✅ Độ tin cậy: </span>
                <span className="font-semibold text-green-600">{result.confidence_level}</span>
              </div>
            )}

            {result.mae_estimate && (
              <div className="mt-1 text-xs">
                <span className="text-gray-600">⚠️ Sai số ước tính: </span>
                <span className="font-semibold text-orange-600">
                  ±{Math.round(result.mae_estimate).toLocaleString('en-US')} triệu VNĐ
                </span>
              </div>
            )}
          </div>

          <p className="text-xs text-gray-500 italic">
            Lưu ý: Đây chỉ là giá tham khảo dựa trên mô hình machine learning, không thay thế cho việc định giá chuyên nghiệp thực tế.
          </p>
        </div>
      )}
    </div>
  );
}

