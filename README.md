# Magnetic Field Visualisation App

App simulating the magnetic field of coils and magnets. Python codes generates images, React frontend contains an interactive visualization.


## Python : 

Required: Python 3.10+

Setup:

   python3 -m venv .venv  
   source .venv/bin/activate  
   pip install -r requirements.txt  

   python3 simulation.py



## Frontend React

Required: NodeJS (mac: "brew install node")

Setup:

1. Navigate to the frontend directory:
   cd frontend

2. Install dependencies:
   npm install

3. Start the development server:
   npm run dev

4. Open your browser to:
   http://localhost:3000

5. Quit:
   Press q + enter



## Magnétisme :

### Diamagnétisme :

Propriété universelle : tous les matériaux sont au moins diamagnétiques. Si l'on plonge un matériau dans un champ magnétique extérieur, les mouvements des électrons, formant donc des courants, sont induits sous l'influence de ce champ magnétique. Selon la règle de Lenz, ces courants sont dirigés de telle sorte qu'ils s'opposent à la cause qui les a créé. Les nuages électroniques vont donc créer des moments contraires à la direction du champ, et le matériau crée un faible champ opposé au champ externe. 

Caractéristiques :
- Toujours faiblement répulsif
- Aimantation induite très faible
- Disparaît quand le champ est coupé
- Susceptibilité magnétique négative : χ < 0


### Paramagnétisme

Le paramagnétisme est le type de magnétisme d'un milieu matériel qui n'est pas aimanté en l'absence d'un champ magnétique mais qui acquiert, sous l'effet d'un champ extérieur, une aimantation orientée dans le même sens que le champ : les moments magnétiques atomiques s’alignent partiellement avec le champ. Cette aimantation est perdue en l'absence de champs extérieur.

Caractéristiques :
- Faiblement attractif
- Aimantation proportionnelle au champ
- Disparaît quand le champ est coupé
- Susceptibilité magnétique positive faible : χ << 1


### Ferromagnétisme

Le ferromagnétisme désigne la capacité de certains corps à s'aimanter sous l'effet d'un champ magnétique extérieur et à garder une partie de cette aimantation. Forte interaction collective entre moments magnétiques. Formation de domaines magnétiques. Alignement spontané, même sans champ externe.
À température ambiante, seuls les éléments fer, nickel et cobalt sont ferromagnétiques. 

Caractéristiques :
- Fortement attractif
- Peut rester aimanté après coupure du champ (aimant permanent)
- Forte non-linéarité, hystérésis
- Susceptibilité magnétique positive élevée : χ >> 1

L'aimantation de matériaux ferromagnétiques est partiellement conservée lorsque le champ magnétique extérieur est désactivé. Cette aimantation résiduelle est appelée rémanence. Un aimant permanent est toujours un matériau ferromagnétique, mais tous les matériaux ferromagnétiques ne sont pas des aimants permanents. Un aimant permanent est un matériau ferromagnétique à forte coercivité Hc. Cette valeur Hc correspond à l'intensité du champ extérieur nécessaire pour désaimanter le matériau. Si elle est grande, l'aimantation peut être considérée comme permanente. 


### Relations :

Un matériau plongé dans un champs magnétique extérieur H s’aimante proportionnellement au champ. On a la relation : M = χH

où M est l’aimantation du matériau (A/m). Sans champ extérieur, on a des orientations aléatoires → M=0. 
Cette formule n'est pas valable pour les matériaux ferromagnétiques, où il y a des non linéarités (hystérésis, saturation).
Le moment magnétique d’un aimant est : m = M × V, avec V le volume de l’aimant (m³).

On a la relation : B = μ0(H+M) = μ0(1+χ)H = μH

avec : μ = μ0(1+χ)

La susceptibilité magnétique χ mesure donc à quel point le matériau modifie le champ magnétique.


### Explications physiques : 

Tout matériau est diamagnétique. Il se peut toutefois que des propriétés paramagnétiques ou même ferromagnétiques supplémentaires se superposent au diamagnétisme du matériau. Le paramagnétisme ou le ferromagnétisme se produisent précisément au moment où les électrons de l'ensemble de l'enveloppe électronique de chaque atome du matériau possèdent un spin total résultant. Les électrons individuels possèdent toujours un "spin" qui porte un moment magnétique. Dans de nombreux matériaux, les spins des électrons s'annulent toutefois par paires. Ces matériaux sont alors diamagnétiques. Cependant, si chaque atome possède un nombre impair d'électrons, les spins des électrons ne peuvent pas s'annuler par paires dans chaque atome. Chaque atome et ses électrons possèdent alors un spin total résultant du dernier électron "non apparié" restant. Ces matériaux sont paramagnétiques ou ferromagnétiques.

Les moments magnétiques atomiques des spins résultants sont répartis uniformément dans toutes les directions de l'espace en raison du mouvement des atomes, de sorte que les champs magnétiques de tous les aimants élémentaires réunis se compensent mutuellement et que la substance apparaisse non magnétique de l'extérieur.

Les spins totaux résultants de tous les atomes s'alignent cependant dans un champ magnétique extérieur. Le pôle nord de tous les aimants élémentaires pointe alors en direction du pôle sud du champ extérieur et inversement. Dans ce cas, l'échantillon lui-même se comporte comme un aimant et il est attiré par le champ magnétique extérieur. Les courants circulaires induits simultanément, qui sont dirigés en sens inverse de leur cause (le champ magnétique extérieur) en raison de la règle de Lenz, sont plus faibles dans des matériaux paramagnétiques et ferromagnétiques que l'effet des aimants élémentaires alignés, de sorte que l'effet répulsif des courants circulaires induits est surpassé par l'effet attractif des aimants élémentaires alignés. C'est la cause du paramagnétisme et du ferromagnétisme.

À très haute température, tous les matériaux ferromagnétiques deviennent parmagnétiques, car l'énergie thermique des électrons est alors supérieure à l'interaction d'échange et l'alignement parallèle des spins des électrons est détruit. Il existe une température caractéristique propre à chaque matérieu pour cette transition : la température de Curie.

Les matériaux ferromagnétiques sont fortement attirés par les champs magnétiques. Ainsi, un aimant reste collé à une paroi en fer, qui est ferromagnétique, mais pas à une paroi en plastique, qui est généralement diamagnétique. L'interaction entre des champs magnétiques et des matériaux paramagnétiques ou diamagnétiques est très faible, de sorte qu'elle n'est pas directement observable dans la vie quotidienne.


## TODO

Couplage mecanique rope
Force exercée sur un dipole par un champ : ^F = ^grad(^mu . ^B)
Cf : https://chatgpt.com/c/697df73d-5208-8325-aa95-e0b53c0d229c

https://fr.wikipedia.org/wiki/Moment_magn%C3%A9tique


## Problèmes

Est ce qu'une simulation 2D est suffisante pour modéliser ces phénomènes ?

Le champ magnétique généré par les Magnets augmentent si on augmente la nombre de Dipoles à l'intérieur (n_x et n_y)

Actuellement, les Dipoles de l'aiment ne changent pas de direction, alors que ceux de la corde s'alignent sur B, alors que ce sont tous les deux des matériaux ferro.
D'après GPT, il ne faut pas aligner les moments élémentaires (dipoles) sur le champ extérieur pour les aimants car l'aimantation rémanente est très grande (il faudrait un champ très fort pour les faire tourner). Cependant, il faut aligner les moments de la corde (matériau férromagnétique doux) car c'est une aimantation induite qui est donc sensible au champ B extérieur. La norme augmente jusqu'à saturation quand B aumgente : norm = m_sat * tanh(|B_local| / B0).
Quel est le temps nécessaire pour faire saturer les dm ? En régime dynamique, est ce que les dm ont le temps de faire -B -> +B ?
