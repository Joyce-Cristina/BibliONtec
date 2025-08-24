module.exports = {
  ci: {
    collect: {
      staticDistDir: "./public", // ou a pasta onde seu front builda
      url: ["http://localhost:3000"], // URL para rodar os testes
      numberOfRuns: 2
    },
    assert: {
      assertions: {
        "categories:performance": ["error", { minScore: 0.8 }],
        "categories:accessibility": ["error", { minScore: 0.8 }],
        "categories:best-practices": ["error", { minScore: 0.8 }],
        "categories:seo": ["error", { minScore: 0.7 }]
      }
    },
    upload: {
      target: "filesystem",
      outputDir: "./lhci-report"
    }
  }
};
