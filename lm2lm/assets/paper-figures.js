// Data behind the two line-chart figures on the page, transcribed from the paper's own figure sources.
// Nothing here is interpolated: every point is one the paper plots.
window.LM2LM_FIGURES = {
  // Where the "Cost" section's own numbers come from (they are written in index.html, not computed here).
  // Setup: paper Sec. 5.1, "refreshing rollouts every 8 steps with 256 training states and G = 8 proposals per state",
  // so through the default 96 steps RL samples 12 rollouts × 256 × 8 = 24,576 proposals.
  // Dollars: the step-96 row of the paper's data-generation cost table (200 real runs, 2,758 B200 GPU-h, $40,050)
  // at $14.208 per GPU-hour:
  //   real runs      2,758 × 14.208          = $39.2k  (about $196 per run, 13.8 GPU-h)
  //   RWM rewards    40,050 − 39,186         ≈ $0.9k   (about 3.5 cents per sampled proposal)
  //   all run        24,576 × 13.79 × 14.208 ≈ $4.8M   (an estimate made for this page; the paper does not state it)
  //   in-context baselines: 300 real runs, $60,001 (about $200 each)

  // Paper Figure 3 (a, c) and Table 11. Source: figures/plot_cost.py in the paper repository.
  // Costs are data-generation cost in thousands of USD; gains are Avg@4 on held-out states.
  cost: {
    icl: {records: [0, 100, 150, 200, 300], costK: [0, 19.839, 28.986, 39.495, 60.001]},
    lm2lm: {steps: [16, 40, 64, 96, 128], costK: [23.901, 28.330, 36.183, 40.050, 46.626], defaultStep: 96},
    panels: {
      ar: {
        title: 'Autoregressive', unit: '10⁻³ BPB',
        baseIcl: [-7.94, -7.64, -2.12, -1.98, 4.04],
        gptIcl: [6.51, -1.99, -0.56, -0.70, 6.15],
        lm2lm: [1.81, 10.85, 18.01, 17.06, 19.40]
      },
      diffusion: {
        title: 'Diffusion', unit: '10⁻² nats/token',
        baseIcl: [-4.18, 0.52, 2.92, 1.17, 4.03],
        gptIcl: [1.98, 7.89, 5.40, 5.49, 4.94],
        lm2lm: [-1.99, 2.28, 4.43, 7.10, 8.91]
      }
    }
  },
  // Paper Figure 5 (a-c). Source: figures/adv_metrics_vown.json and per_pick_vown.jsonl via plot_analysis_all.py.
  // Each value is [estimate, lower, upper] with a 95% bootstrap interval over the 60 held-out AR states.
  // "static" keeps the initial 100 records throughout; "lm2lm" is scored by the RWM in force at that step.
  reliability: {
    calibrations: [16, 40, 64, 96],
    static: [
      {step: 16, cos: [0.693, 0.600, 0.769], rank: [0.718, 0.655, 0.776], gap: [0.637, 0.346, 0.930]},
      {step: 32, cos: [0.708, 0.629, 0.777], rank: [0.677, 0.603, 0.747], gap: [0.667, 0.382, 0.957]},
      {step: 48, cos: [0.603, 0.412, 0.732], rank: [0.629, 0.530, 0.716], gap: [0.786, 0.428, 1.156]},
      {step: 64, cos: [0.386, 0.076, 0.591], rank: [0.487, 0.380, 0.592], gap: [0.803, 0.434, 1.189]},
      {step: 96, cos: [-0.391, -0.578, -0.164], rank: [0.394, 0.302, 0.485], gap: [2.010, 1.299, 2.761]},
      {step: 128, cos: [-0.425, -0.659, -0.128], rank: [0.374, 0.283, 0.480], gap: [1.813, 1.236, 2.425]}
    ],
    lm2lm: [
      {step: 16, cos: [0.550, 0.373, 0.693], rank: [0.689, 0.613, 0.760], gap: [0.791, 0.486, 1.115]},
      {step: 40, cos: [0.627, 0.497, 0.744], rank: [0.654, 0.579, 0.729], gap: [0.820, 0.574, 1.064]},
      {step: 48, cos: [0.615, 0.439, 0.746], rank: [0.690, 0.603, 0.772], gap: [0.624, 0.427, 0.831]},
      {step: 64, cos: [0.619, 0.424, 0.763], rank: [0.645, 0.556, 0.733], gap: [0.647, 0.396, 0.883]},
      {step: 96, cos: [0.504, 0.261, 0.668], rank: [0.611, 0.517, 0.702], gap: [0.855, 0.614, 1.110]},
      {step: 128, cos: [0.707, 0.542, 0.816], rank: [0.615, 0.521, 0.703], gap: [0.167, 0.020, 0.312]}
    ]
  }
};
