import React, { useState, useEffect } from "react";
import {
  Sprout,
  TrendingUp,
  Database,
  CheckCircle2,
  RefreshCw,
  SlidersHorizontal,
  Compass,
  FileSpreadsheet
} from "lucide-react";

export default function App() {
  // Dropdown categories and metadata from backend
  const [categories, setCategories] = useState({
    State: [],
    District: [],
    Crop: [],
    Season: []
  });
  const [metrics, setMetrics] = useState(null);
  const [loadingMeta, setLoadingMeta] = useState(true);

  // Form input state
  const [formData, setFormData] = useState({
    state: "",
    district: "",
    crop: "",
    season: "",
    crop_year: 2020,
    area: 10.0
  });

  // Prediction and state handling
  const [predicting, setPredicting] = useState(false);
  const [predictionResult, setPredictionResult] = useState(null);
  const [formError, setFormError] = useState("");

  // History state
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const fetchMetadata = async () => {
    try {
      setLoadingMeta(true);
      const res = await fetch("/api/metadata");
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories || {});
        setMetrics(data.metrics || null);

        // Pre-fill default form fields with first available options
        if (data.categories) {
          setFormData((prev) => ({
            ...prev,
            state: data.categories.State?.[0] || "",
            district: data.categories.District?.[0] || "",
            crop: data.categories.Crop?.[0] || "",
            season: data.categories.Season?.[0] || ""
          }));
        }
      }
    } catch (err) {
      console.error("Error fetching metadata:", err);
    } finally {
      setLoadingMeta(false);
    }
  };

  const fetchHistory = async () => {
    try {
      setLoadingHistory(true);
      const res = await fetch("/api/history?limit=10");
      if (res.ok) {
        const data = await res.json();
        setHistory(data.history || []);
      }
    } catch (err) {
      console.error("Error fetching history:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Load metadata and initial history on mount
  useEffect(() => {
    fetchMetadata();
    fetchHistory();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "crop_year" || name === "area" ? Number(value) : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!formData.state || !formData.district || !formData.crop || !formData.season) {
      setFormError("Please complete all categorical fields before running prediction.");
      return;
    }
    if (formData.area <= 0) {
      setFormError("Cultivated area must be greater than zero hectares.");
      return;
    }

    try {
      setPredicting(true);
      const res = await fetch("/api/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Prediction request could not be processed.");
      }

      const data = await res.json();
      setPredictionResult(data.prediction);

      // Refresh history list
      fetchHistory();
    } catch (err) {
      setFormError(err.message || "Unable to reach the prediction service.");
    } finally {
      setPredicting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f7f4] text-[#1f1b16] font-sans antialiased">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-[#ffffff]/95 backdrop-blur-xs border-b border-[#e7e4dc]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#245842] text-[#f8f7f4] flex items-center justify-center shrink-0">
              <Sprout className="w-4 h-4" strokeWidth={1.75} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-[#1f1b16] tracking-tight">
                  Crop Yield Intelligence
                </span>
                <span className="hidden sm:inline-block text-[11px] font-mono text-[#7b7266] border border-[#e7e4dc] px-1.5 py-0.5 rounded">
                  v1.0
                </span>
              </div>
              <p className="text-xs text-[#7b7266] leading-none hidden sm:block">
                Regional harvest classification against historical medians
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 text-xs">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#f3f0e8] text-[#5e554a] border border-[#e7e4dc] font-mono">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#245842]" strokeWidth={1.75} />
              <span>Decision Tree (76.88%)</span>
            </span>
            <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#f3f0e8] text-[#5e554a] border border-[#e7e4dc] font-mono">
              <Database className="w-3.5 h-3.5 text-[#7b7266]" strokeWidth={1.75} />
              <span>MongoDB</span>
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        
        {/* CONSOLE SECTION: YIELD PREDICTION */}
        <section className="bg-[#ffffff] rounded-xl border border-[#e7e4dc] p-6 sm:p-7 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
          <div className="flex items-center justify-between pb-5 mb-6 border-b border-[#f1eee7]">
            <div>
              <h2 className="text-base font-semibold text-[#1f1b16]">
                Yield Performance Prediction
              </h2>
              <p className="text-xs text-[#7b7266] mt-0.5">
                Specify regional agro-climatic parameters to classify expected yield
              </p>
            </div>
            <div className="flex items-center gap-1 text-xs text-[#7b7266]">
              <SlidersHorizontal className="w-3.5 h-3.5" strokeWidth={1.5} />
              <span className="hidden sm:inline">Inference Parameters</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {/* State Dropdown */}
              <div>
                <label className="block text-xs font-medium text-[#5e554a] mb-1.5">
                  State
                </label>
                <select
                  name="state"
                  disabled={loadingMeta}
                  value={formData.state}
                  onChange={handleInputChange}
                  className="w-full h-9 bg-[#fcfbfa] border border-[#dcd7cc] text-[#1f1b16] text-xs sm:text-sm rounded-lg px-3 focus:border-[#245842] focus:ring-1 focus:ring-[#245842] focus:outline-hidden transition-colors disabled:opacity-60"
                >
                  {loadingMeta ? (
                    <option>Loading states...</option>
                  ) : (
                    categories.State?.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* District Dropdown */}
              <div>
                <label className="block text-xs font-medium text-[#5e554a] mb-1.5">
                  District
                </label>
                <select
                  name="district"
                  value={formData.district}
                  onChange={handleInputChange}
                  className="w-full h-9 bg-[#fcfbfa] border border-[#dcd7cc] text-[#1f1b16] text-xs sm:text-sm rounded-lg px-3 focus:border-[#245842] focus:ring-1 focus:ring-[#245842] focus:outline-hidden transition-colors"
                >
                  {categories.District?.map((dist) => (
                    <option key={dist} value={dist}>
                      {dist}
                    </option>
                  ))}
                </select>
              </div>

              {/* Crop Dropdown */}
              <div>
                <label className="block text-xs font-medium text-[#5e554a] mb-1.5">
                  Crop type (top 10 represented)
                </label>
                <select
                  name="crop"
                  value={formData.crop}
                  onChange={handleInputChange}
                  className="w-full h-9 bg-[#fcfbfa] border border-[#dcd7cc] text-[#1f1b16] text-xs sm:text-sm rounded-lg px-3 focus:border-[#245842] focus:ring-1 focus:ring-[#245842] focus:outline-hidden transition-colors"
                >
                  {categories.Crop?.map((cp) => (
                    <option key={cp} value={cp}>
                      {cp}
                    </option>
                  ))}
                </select>
              </div>

              {/* Season Dropdown */}
              <div>
                <label className="block text-xs font-medium text-[#5e554a] mb-1.5">
                  Cultivation season
                </label>
                <select
                  name="season"
                  value={formData.season}
                  onChange={handleInputChange}
                  className="w-full h-9 bg-[#fcfbfa] border border-[#dcd7cc] text-[#1f1b16] text-xs sm:text-sm rounded-lg px-3 focus:border-[#245842] focus:ring-1 focus:ring-[#245842] focus:outline-hidden transition-colors"
                >
                  {categories.Season?.map((sn) => (
                    <option key={sn} value={sn}>
                      {sn}
                    </option>
                  ))}
                </select>
              </div>

              {/* Crop Year */}
              <div>
                <label className="block text-xs font-medium text-[#5e554a] mb-1.5">
                  Harvest year
                </label>
                <input
                  type="number"
                  name="crop_year"
                  min="1995"
                  max="2030"
                  value={formData.crop_year}
                  onChange={handleInputChange}
                  className="w-full h-9 bg-[#fcfbfa] border border-[#dcd7cc] text-[#1f1b16] text-xs sm:text-sm rounded-lg px-3 font-mono tabular-nums focus:border-[#245842] focus:ring-1 focus:ring-[#245842] focus:outline-hidden transition-colors"
                  required
                />
              </div>

              {/* Area */}
              <div>
                <label className="block text-xs font-medium text-[#5e554a] mb-1.5">
                  Cultivated area (hectares)
                </label>
                <input
                  type="number"
                  name="area"
                  step="0.1"
                  min="0.1"
                  value={formData.area}
                  onChange={handleInputChange}
                  className="w-full h-9 bg-[#fcfbfa] border border-[#dcd7cc] text-[#1f1b16] text-xs sm:text-sm rounded-lg px-3 font-mono tabular-nums focus:border-[#245842] focus:ring-1 focus:ring-[#245842] focus:outline-hidden transition-colors"
                  required
                />
              </div>
            </div>

            {formError && (
              <div className="p-3 bg-[#fef2f2] border border-[#fecaca] text-[#991b1b] rounded-lg text-xs leading-relaxed">
                {formError}
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <button
                type="submit"
                disabled={predicting}
                className="inline-flex items-center justify-center h-10 px-5 bg-[#245842] hover:bg-[#1c4432] text-[#f8f7f4] font-medium text-xs sm:text-sm rounded-lg transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
              >
                {predicting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 mr-2 animate-spin" strokeWidth={1.75} />
                    Calculating yield classification...
                  </>
                ) : (
                  <>
                    <TrendingUp className="w-3.5 h-3.5 mr-2" strokeWidth={1.75} />
                    Predict yield category
                  </>
                )}
              </button>

              <span className="text-[11px] text-[#7b7266] font-mono hidden sm:inline">
                Indexed to India Agricultural Ministry dataset
              </span>
            </div>
          </form>

          {/* Prediction Result Display */}
          {predictionResult && (
            <div className="mt-8 pt-6 border-t border-[#f1eee7]">
              <div
                className={`rounded-lg p-5 border ${
                  predictionResult.class_code === 1
                    ? "bg-[#f5f9f6] border-[#cfe2d7]"
                    : "bg-[#fcf7f1] border-[#eedbc9]"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-[11px] font-mono uppercase tracking-wider text-[#7b7266]">
                      Model Classification Outcome
                    </span>
                    <div className="flex items-baseline gap-3 mt-1">
                      <span
                        className={`text-xl sm:text-2xl font-semibold tracking-tight ${
                          predictionResult.class_code === 1 ? "text-[#1e6b42]" : "text-[#92400e]"
                        }`}
                      >
                        {predictionResult.label}
                      </span>
                      <span className="text-xs font-mono text-[#5e554a] bg-[#ffffff] border border-[#e7e4dc] px-2 py-0.5 rounded">
                        Crop median: {predictionResult.crop_median} units
                      </span>
                    </div>
                    <p className="text-xs text-[#5e554a] mt-2 max-w-2xl leading-relaxed">
                      {predictionResult.explanation}
                    </p>
                  </div>

                  <div className="bg-[#ffffff] border border-[#e7e4dc] px-4 py-2.5 rounded-lg text-left sm:text-right shrink-0">
                    <span className="text-[11px] font-mono text-[#7b7266] block">Binary class</span>
                    <span className="text-sm font-semibold font-mono text-[#1f1b16]">
                      Code {predictionResult.class_code}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* SECTION: MODEL PERFORMANCE & FEATURE INFLUENCE */}
        <section className="bg-[#ffffff] rounded-xl border border-[#e7e4dc] p-6 sm:p-7 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
          <div className="flex items-center justify-between pb-5 mb-6 border-b border-[#f1eee7]">
            <div>
              <h2 className="text-base font-semibold text-[#1f1b16]">
                Model Evaluation & Feature Influence
              </h2>
              <p className="text-xs text-[#7b7266] mt-0.5">
                Validation metrics measured against 27,369 held-out test records (80:20 split)
              </p>
            </div>
            <div className="flex items-center gap-1 text-xs text-[#7b7266]">
              <Compass className="w-3.5 h-3.5" strokeWidth={1.5} />
              <span className="hidden sm:inline">Decision Tree Diagnostics</span>
            </div>
          </div>

          {/* Unified Core Metrics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-7">
            <div className="bg-[#fcfbfa] border border-[#e7e4dc] p-4 rounded-lg">
              <span className="text-xs text-[#7b7266]">Accuracy</span>
              <div className="text-2xl font-semibold text-[#1f1b16] font-mono tabular-nums mt-1">
                {metrics ? `${(metrics.accuracy * 100).toFixed(2)}%` : "76.88%"}
              </div>
              <span className="text-[11px] text-[#7b7266] block mt-1">Overall correctness</span>
            </div>

            <div className="bg-[#fcfbfa] border border-[#e7e4dc] p-4 rounded-lg">
              <span className="text-xs text-[#7b7266]">Precision</span>
              <div className="text-2xl font-semibold text-[#1f1b16] font-mono tabular-nums mt-1">
                {metrics ? `${(metrics.precision * 100).toFixed(2)}%` : "78.59%"}
              </div>
              <span className="text-[11px] text-[#7b7266] block mt-1">High-yield reliability</span>
            </div>

            <div className="bg-[#fcfbfa] border border-[#e7e4dc] p-4 rounded-lg">
              <span className="text-xs text-[#7b7266]">Recall</span>
              <div className="text-2xl font-semibold text-[#1f1b16] font-mono tabular-nums mt-1">
                {metrics ? `${(metrics.recall * 100).toFixed(2)}%` : "73.74%"}
              </div>
              <span className="text-[11px] text-[#7b7266] block mt-1">High-yield capture rate</span>
            </div>

            <div className="bg-[#fcfbfa] border border-[#e7e4dc] p-4 rounded-lg">
              <span className="text-xs text-[#7b7266]">F1-score</span>
              <div className="text-2xl font-semibold text-[#1f1b16] font-mono tabular-nums mt-1">
                {metrics ? `${(metrics.f1_score * 100).toFixed(2)}%` : "76.09%"}
              </div>
              <span className="text-[11px] text-[#7b7266] block mt-1">Harmonic mean balance</span>
            </div>
          </div>

          {/* Technical Breakdown & Feature Importance */}
          <div className="grid md:grid-cols-2 gap-7 text-xs text-[#5e554a]">
            {/* Methodology questions */}
            <div className="space-y-4">
              <div className="border-l-2 border-[#245842] pl-3">
                <h4 className="font-medium text-[#1f1b16]">Training Dataset Scope</h4>
                <p className="text-[#7b7266] mt-0.5 leading-relaxed">
                  Indian agricultural production records (345,336 raw entries, refined to 136,845 verified records covering the 10 highest-volume crops).
                </p>
              </div>

              <div className="border-l-2 border-[#245842] pl-3">
                <h4 className="font-medium text-[#1f1b16]">Target Definition</h4>
                <p className="text-[#7b7266] mt-0.5 leading-relaxed">
                  Binary classification (<span className="font-mono text-[#1f1b16]">High_Yield</span>): labeled 1 when the yield exceeds the median yield calculated specifically for that crop across all historical seasons, and 0 otherwise.
                </p>
              </div>

              <div className="border-l-2 border-[#245842] pl-3">
                <h4 className="font-medium text-[#1f1b16]">Data Leakage Prevention</h4>
                <p className="text-[#7b7266] mt-0.5 leading-relaxed">
                  Direct production and tonnage figures are deliberately excluded from predictor variables; only regional and spatial coordinates are supplied at inference time.
                </p>
              </div>
            </div>

            {/* Feature Importance Proportional Bars */}
            <div className="bg-[#fcfbfa] border border-[#e7e4dc] p-4 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-[#1f1b16]">Feature Importance Distribution</h4>
                <span className="text-[11px] font-mono text-[#7b7266]">Gini impurity reduction</span>
              </div>

              <div className="space-y-2.5">
                {metrics?.feature_importances ? (
                  Object.entries(metrics.feature_importances).map(([feat, score]) => {
                    const pct = (score * 100).toFixed(1);
                    return (
                      <div key={feat} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-mono text-[#1f1b16]">{feat}</span>
                          <span className="font-mono tabular-nums text-[#5e554a]">{pct}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-[#f1eee7] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#245842] rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-[#7b7266]">Loading feature importance metrics...</p>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* SECTION: PREDICTION LOGS (MONGODB) */}
        <section className="bg-[#ffffff] rounded-xl border border-[#e7e4dc] p-6 sm:p-7 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
          <div className="flex items-center justify-between pb-5 mb-5 border-b border-[#f1eee7]">
            <div>
              <h2 className="text-base font-semibold text-[#1f1b16]">
                Recent Prediction Logs
              </h2>
              <p className="text-xs text-[#7b7266] mt-0.5">
                Persisted session inferences logged directly to MongoDB
              </p>
            </div>
            <button
              onClick={fetchHistory}
              disabled={loadingHistory}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#e7e4dc] bg-[#fcfbfa] hover:bg-[#f3f0e8] text-xs text-[#5e554a] transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#7b7266] ${loadingHistory ? "animate-spin" : ""}`} strokeWidth={1.5} />
              <span>Refresh logs</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#e7e4dc] bg-[#fcfbfa] text-[#7b7266] font-medium">
                  <th className="py-2.5 px-3 font-mono">Timestamp</th>
                  <th className="py-2.5 px-3">State & District</th>
                  <th className="py-2.5 px-3">Crop</th>
                  <th className="py-2.5 px-3">Season & Year</th>
                  <th className="py-2.5 px-3 font-mono text-right">Area (ha)</th>
                  <th className="py-2.5 px-3 text-right">Classification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1eee7]">
                {history.length > 0 ? (
                  history.map((item, idx) => (
                    <tr key={idx} className="hover:bg-[#fcfbfa] transition-colors">
                      <td className="py-2.5 px-3 font-mono text-[#7b7266] whitespace-nowrap">
                        {item.timestamp}
                      </td>
                      <td className="py-2.5 px-3 text-[#1f1b16]">
                        {item.inputs?.State}, {item.inputs?.District}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-[#1f1b16]">
                        {item.inputs?.Crop}
                      </td>
                      <td className="py-2.5 px-3 text-[#5e554a]">
                        {item.inputs?.Season} • {item.inputs?.Crop_Year}
                      </td>
                      <td className="py-2.5 px-3 font-mono tabular-nums text-right text-[#5e554a]">
                        {item.inputs?.Area}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium border ${
                            item.prediction === "High Yield"
                              ? "bg-[#f5f9f6] text-[#1e6b42] border-[#cfe2d7]"
                              : "bg-[#fcf7f1] text-[#92400e] border-[#eedbc9]"
                          }`}
                        >
                          {item.prediction}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-[#7b7266]">
                      No inferences stored in this session yet. Submit a prediction above to record logs.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* METHODOLOGY REFERENCE SECTION */}
        <section className="bg-[#fcfbfa] rounded-xl border border-[#e7e4dc] p-5 sm:p-6 text-xs text-[#5e554a]">
          <div className="flex items-center gap-2 mb-3 text-[#1f1b16] font-medium">
            <FileSpreadsheet className="w-4 h-4 text-[#245842]" strokeWidth={1.75} />
            <span>Dataset & Pipeline Architecture</span>
          </div>
          <p className="leading-relaxed text-[#7b7266]">
            This agricultural intelligence pipeline standardizes historical state-level crop statistics across India. Categorical coordinates (State, District, Crop, Season) are mapped using discrete ordinal label encodings aligned with the trained scikit-learn model artifacts. Predictions classify whether expected yield is in the upper 50th percentile (High Yield) or lower 50th percentile (Low Yield) of that specific crop's historical distribution.
          </p>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#e7e4dc] bg-[#ffffff] py-6 text-center text-xs text-[#7b7266]">
        <p>
          Crop Yield Intelligence System • Scikit-Learn Decision Tree Classifier • PyMongo & Flask API
        </p>
      </footer>
    </div>
  );
}
