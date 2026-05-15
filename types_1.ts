export type MathCategory = 
  | 'calculus'
  | 'algebra'
  | 'trigonometry'
  | 'precalculus'

export type MathTopic = 
  // Integral Calculus
  | 'u-substitution'
  | 'integration-by-parts'
  | 'trig-substitution'
  | 'partial-fractions'
  | 'improper-integrals'
  | 'definite-integrals'
  // Differential Calculus
  | 'basic-derivatives'
  | 'chain-rule'
  | 'product-rule'
  | 'quotient-rule'
  | 'implicit-differentiation'
  | 'related-rates'
  | 'optimization'
  // Limits & Continuity
  | 'limits'
  | 'lhopitals-rule'
  | 'continuity'
  // Series & Sequences
  | 'series'
  | 'taylor-series'
  | 'convergence-tests'
  // Algebra
  | 'factoring'
  | 'quadratic-equations'
  | 'polynomial-equations'
  | 'rational-expressions'
  | 'logarithms'
  | 'exponentials'
  // Trigonometry
  | 'trig-identities'
  | 'trig-equations'
  | 'inverse-trig'
  // Precalculus
  | 'functions'
  | 'graphing'
  | 'conic-sections'
  // Calculus III — Vectors & 3D Geometry
  | 'vector-operations'
  | 'dot-product'
  | 'cross-product'
  | 'vector-projections'
  | 'lines-and-planes'
  | 'quadric-surfaces'
  // Calculus III — Vector-Valued Functions
  | 'vector-functions'
  | 'vector-derivatives-integrals'
  | 'arc-length-3d'
  | 'curvature'
  | 'tnt-frames'
  // Calculus III — Multivariable Differentiation
  | 'partial-derivatives'
  | 'chain-rule-multivariable'
  | 'directional-derivatives'
  | 'gradient'
  | 'tangent-planes'
  | 'multivariable-optimization'
  | 'lagrange-multipliers'
  // Calculus III — Multivariable Integration
  | 'double-integrals-cartesian'
  | 'double-integrals-polar'
  | 'triple-integrals-cartesian'
  | 'triple-integrals-cylindrical'
  | 'triple-integrals-spherical'
  | 'jacobian'
  // Calculus III — Vector Calculus
  | 'line-integrals-scalar'
  | 'line-integrals-vector'
  | 'greens-theorem'
  | 'curl-and-divergence'
  | 'parametric-surfaces'
  | 'surface-integrals-scalar'
  | 'surface-integrals-vector'
  | 'stokes-theorem'
  | 'divergence-theorem'
  // Linear Algebra — Matrix Mechanics
  | 'matrix-operations'
  | 'row-reduction'
  | 'solving-linear-systems'
  | 'matrix-inverses'
  | 'lu-decomposition'
  | 'transpose'
  // Linear Algebra — Determinants
  | 'determinants-cofactor'
  | 'determinants-row-ops'
  | 'cramers-rule'
  // Linear Algebra — Vector Spaces
  | 'span-and-independence'
  | 'basis-and-dimension'
  | 'null-space-column-space'
  | 'rank-nullity'
  | 'change-of-basis'
  // Linear Algebra — Eigenvalues & Decompositions
  | 'eigenvalues-eigenvectors'
  | 'diagonalization'
  | 'orthogonal-diagonalization'
  // Linear Algebra — Orthogonality
  | 'gram-schmidt'
  | 'orthogonal-projections'
  | 'least-squares'
  // Linear Algebra — Linear Transformations
  | 'linear-transformations'
  | 'kernel-and-range'

export type Difficulty = 'easy' | 'medium' | 'hard'

export interface MathProblem {
  question: string
  solution: string
  topic: MathTopic
  difficulty: Difficulty
}

export interface UserSettings {
  topics: MathTopic[]
  difficulties: Difficulty[]
}

export interface TopicGroup {
  category: string
  topics: MathTopic[]
}

export const TOPIC_GROUPS: TopicGroup[] = [
  {
    category: 'College Algebra',
    topics: ['factoring', 'quadratic-equations', 'polynomial-equations', 'rational-expressions', 'logarithms', 'exponentials']
  },
  {
    category: 'Precalculus',
    topics: ['functions', 'graphing', 'conic-sections', 'trig-identities', 'trig-equations', 'inverse-trig']
  },
  {
    category: 'Calculus I',
    topics: ['limits', 'lhopitals-rule', 'continuity', 'basic-derivatives', 'chain-rule', 'product-rule', 'quotient-rule', 'implicit-differentiation', 'related-rates', 'optimization']
  },
  {
    category: 'Calculus II',
    topics: ['u-substitution', 'integration-by-parts', 'trig-substitution', 'partial-fractions', 'improper-integrals', 'definite-integrals', 'series', 'taylor-series', 'convergence-tests']
  },
  {
    category: 'Calculus III',
    topics: [
      'vector-operations', 'dot-product', 'cross-product', 'vector-projections', 'lines-and-planes', 'quadric-surfaces',
      'vector-functions', 'vector-derivatives-integrals', 'arc-length-3d', 'curvature', 'tnt-frames',
      'partial-derivatives', 'chain-rule-multivariable', 'directional-derivatives', 'gradient', 'tangent-planes', 'multivariable-optimization', 'lagrange-multipliers',
      'double-integrals-cartesian', 'double-integrals-polar', 'triple-integrals-cartesian', 'triple-integrals-cylindrical', 'triple-integrals-spherical', 'jacobian',
      'line-integrals-scalar', 'line-integrals-vector', 'greens-theorem', 'curl-and-divergence', 'parametric-surfaces', 'surface-integrals-scalar', 'surface-integrals-vector', 'stokes-theorem', 'divergence-theorem'
    ]
  },
  {
    category: 'Linear Algebra',
    topics: [
      'matrix-operations', 'row-reduction', 'solving-linear-systems', 'matrix-inverses', 'lu-decomposition', 'transpose',
      'determinants-cofactor', 'determinants-row-ops', 'cramers-rule',
      'span-and-independence', 'basis-and-dimension', 'null-space-column-space', 'rank-nullity', 'change-of-basis',
      'eigenvalues-eigenvectors', 'diagonalization', 'orthogonal-diagonalization',
      'gram-schmidt', 'orthogonal-projections', 'least-squares',
      'linear-transformations', 'kernel-and-range'
    ]
  }
]

export const TOPIC_LABELS: Record<MathTopic, string> = {
  // Integral Calculus
  'u-substitution': 'U-Substitution',
  'integration-by-parts': 'Integration by Parts',
  'trig-substitution': 'Trig Substitution',
  'partial-fractions': 'Partial Fractions',
  'improper-integrals': 'Improper Integrals',
  'definite-integrals': 'Definite Integrals',
  // Differential Calculus
  'basic-derivatives': 'Basic Derivatives',
  'chain-rule': 'Chain Rule',
  'product-rule': 'Product Rule',
  'quotient-rule': 'Quotient Rule',
  'implicit-differentiation': 'Implicit Differentiation',
  'related-rates': 'Related Rates',
  'optimization': 'Optimization',
  // Limits & Continuity
  'limits': 'Limits',
  'lhopitals-rule': "L'Hôpital's Rule",
  'continuity': 'Continuity',
  // Series & Sequences
  'series': 'Series',
  'taylor-series': 'Taylor Series',
  'convergence-tests': 'Convergence Tests',
  // Algebra
  'factoring': 'Factoring',
  'quadratic-equations': 'Quadratic Equations',
  'polynomial-equations': 'Polynomial Equations',
  'rational-expressions': 'Rational Expressions',
  'logarithms': 'Logarithms',
  'exponentials': 'Exponentials',
  // Trigonometry
  'trig-identities': 'Trig Identities',
  'trig-equations': 'Trig Equations',
  'inverse-trig': 'Inverse Trig Functions',
  // Precalculus
  'functions': 'Functions',
  'graphing': 'Graphing',
  'conic-sections': 'Conic Sections',
  // Calculus III — Vectors & 3D Geometry
  'vector-operations': 'Vector Operations',
  'dot-product': 'Dot Product',
  'cross-product': 'Cross Product',
  'vector-projections': 'Vector Projections',
  'lines-and-planes': 'Lines & Planes in 3D',
  'quadric-surfaces': 'Quadric Surfaces',
  // Calculus III — Vector-Valued Functions
  'vector-functions': 'Vector-Valued Functions',
  'vector-derivatives-integrals': 'Derivatives & Integrals of Vector Functions',
  'arc-length-3d': 'Arc Length in 3D',
  'curvature': 'Curvature',
  'tnt-frames': 'TNB Frames',
  // Calculus III — Multivariable Differentiation
  'partial-derivatives': 'Partial Derivatives',
  'chain-rule-multivariable': 'Multivariable Chain Rule',
  'directional-derivatives': 'Directional Derivatives',
  'gradient': 'Gradient',
  'tangent-planes': 'Tangent Planes',
  'multivariable-optimization': 'Multivariable Optimization',
  'lagrange-multipliers': 'Lagrange Multipliers',
  // Calculus III — Multivariable Integration
  'double-integrals-cartesian': 'Double Integrals (Cartesian)',
  'double-integrals-polar': 'Double Integrals (Polar)',
  'triple-integrals-cartesian': 'Triple Integrals (Cartesian)',
  'triple-integrals-cylindrical': 'Triple Integrals (Cylindrical)',
  'triple-integrals-spherical': 'Triple Integrals (Spherical)',
  'jacobian': 'Jacobian & Change of Variables',
  // Calculus III — Vector Calculus
  'line-integrals-scalar': 'Line Integrals (Scalar)',
  'line-integrals-vector': 'Line Integrals (Vector Fields)',
  'greens-theorem': "Green's Theorem",
  'curl-and-divergence': 'Curl & Divergence',
  'parametric-surfaces': 'Parametric Surfaces',
  'surface-integrals-scalar': 'Surface Integrals (Scalar)',
  'surface-integrals-vector': 'Surface Integrals (Flux)',
  'stokes-theorem': "Stokes' Theorem",
  'divergence-theorem': 'Divergence Theorem',
  // Linear Algebra — Matrix Mechanics
  'matrix-operations': 'Matrix Operations',
  'row-reduction': 'Row Reduction',
  'solving-linear-systems': 'Solving Linear Systems',
  'matrix-inverses': 'Matrix Inverses',
  'lu-decomposition': 'LU Decomposition',
  'transpose': 'Transpose & Symmetric Matrices',
  // Linear Algebra — Determinants
  'determinants-cofactor': 'Determinants (Cofactor Expansion)',
  'determinants-row-ops': 'Determinants (Row Operations)',
  'cramers-rule': "Cramer's Rule",
  // Linear Algebra — Vector Spaces
  'span-and-independence': 'Span & Linear Independence',
  'basis-and-dimension': 'Basis & Dimension',
  'null-space-column-space': 'Null Space & Column Space',
  'rank-nullity': 'Rank-Nullity Theorem',
  'change-of-basis': 'Change of Basis',
  // Linear Algebra — Eigenvalues & Decompositions
  'eigenvalues-eigenvectors': 'Eigenvalues & Eigenvectors',
  'diagonalization': 'Diagonalization',
  'orthogonal-diagonalization': 'Orthogonal Diagonalization',
  // Linear Algebra — Orthogonality
  'gram-schmidt': 'Gram-Schmidt Process',
  'orthogonal-projections': 'Orthogonal Projections',
  'least-squares': 'Least Squares',
  // Linear Algebra — Linear Transformations
  'linear-transformations': 'Linear Transformations',
  'kernel-and-range': 'Kernel & Range',
}

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
}

export const ALL_TOPICS: MathTopic[] = TOPIC_GROUPS.flatMap(group => group.topics)

export const ALL_DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard']
