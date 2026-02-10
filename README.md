# Simulation de champ magnétique multi-sources

Application simulant le champ magnétique généré par des bobines et des aimants. Des bobines de mesure permettent de quantifier le champ grace au courant induit. Cette simulation permet de voir l'impact d'un champ magnétique dynamique sur le mouvement d'une corde ferromagnétique.
Le frontend React propose une visualisation interactive et des scripts Python génèrent des images statiques du champ.


### Frontend React

Nécessite : NodeJS (mac : "brew install node")

Installation :

1. Aller dans le dossier frontend :
   cd frontend

2. Installer les dépendances :
   npm install

3. Lancer le serveur de développement :
   npm run dev

4. Ouvrir votre navigateur à l’adresse :
   http://localhost:3000

5. Quitter :
   Appuyez sur q + entrée


### Python : 

Nécessite : Python 3.10+

Installation :

1. Créer un environnement virtuel :
   python3 -m venv .venv  
   
2. L’activer :
   source .venv/bin/activate  

3. Installer les dépendances :
   pip install -r requirements.txt  

4. Générer les images :
   python3 simulation.py


# Modélisation physique

## Bobine 

On considère un solénoïde fini de rayon $a$, de longueur $L$, comportant $N$ spires et parcouru par un courant $I$. Sa densité linéique de spires est $
n = \frac{N}{L}$. Le point d’observation est décrit en coordonnées cylindriques *$(r,z)$*.

On définit :

$$
\xi = z - z_0
$$

où *$z_0$* désigne la position axiale d’une spire élémentaire.



### Champ magnétique

Le champ magnétique est exprimé en coordonnées cylindriques $(r,z)$ :

$$
\mathbf{B}(r,z) = B_r(r,z)\,\mathbf{e}_r + B_z(r,z)\,\mathbf{e}_z
$$

En posant $r = |x-x_0|$ et $z = y-y_0$, les composantes cartésiennes du champ sont :

$$
B_x = -B_r \, \mathrm{sign}(x-x_0)
$$

$$
B_y = B_z
$$


#### Champ magnétique radial $B_r$

Par symétrie, sur l’axe du solénoïde (*$r = 0$*), on a :

$$
B_r = 0
$$

Pour *$r > 0$*, le champ radial est donné par la différence des contributions
évaluées aux bornes du solénoïde :

$$
B_r(r) = B_r^{\text{high}} - B_r^{\text{low}}
$$

où $\xi^{\text{high}} = z + L$ et $\xi^{\text{low}} = z - L$. On peut calculer ces deux terme avec la formule :

$$
B_r^{(\xi)} =
\frac{\mu\, n\, I}{\pi}
\sqrt{\frac{a}{r}}
\left[
\frac{2-k^2}{2k}\,K(k^2)
-
\frac{1}{k}\,E(k^2)
\right]
$$

où :
- *$K(k^2)$* est l’intégrale elliptique complète du premier type,
- *$E(k^2)$* est l’intégrale elliptique complète du second type,
- *$k^2 = \frac{4ar}{\xi^2 + (a+r)^2}$* est le module elliptique avec la contrainte numérique : $ 0 \le k^2 < 1$.




#### Champ magnétique axial $B_z$

Pour *$r > 0$*, le champ axial s’écrit :

$$
B_z(r) = B_z^{\text{high}} - B_z^{\text{low}}
$$

avec :

$$
B_z^{(\xi)} =
\frac{\mu\, n\, I}{4}
\left[
\frac{\xi\, k}{\pi\sqrt{ar}}\,K(k^2)
+
\mathrm{sign}\!\big((a-r)\xi\big)\,
\Lambda(\phi,k)
\right]
$$

où :
- *$\Lambda(\phi,k)$* est la fonction lambda de Heuman,
- *$\mathrm{sign}$* est la fonction signe,
- $\phi = \arctan\!\left(\left|\frac{\xi}{a-r}\right|\right)$ l’angle auxiliaire.




### Potentiel vecteur

Le potentiel vecteur est supposé dirigé selon $z$ :

$$
\mathbf{A} = A_z(x,y)\,\mathbf{e}_z
$$

Le solénoïde est discrétisé en $N$ boucles élémentaires :

$$
A_z(r,z) =
-\mathrm{sign}(x-x_0) \sum_{i=1}^{N}
A_\phi^{\text{boucle}}\!\left(r, z-z_i\right)
$$

avec la position de la $i$-ème boucle :

$$
z_i = -\frac{L}{2} + \left(i-\frac12\right)\frac{L}{N}
$$

#### Potentiel d'une boucle $A_\phi$

Pour une boucle située à l'origine ($z=0$), le potentiel est donné par :

$$
A_\phi^{\text{boucle}}(r,z) =
\frac{\mu\, I}{\pi\, k} \sqrt{\frac{a}{r}}
\left[
\left(1 - \frac{k^2}{2}\right) K(k^2) - E(k^2)
\right]
$$

où :
- $K(k^2)$ et $E(k^2)$ sont les intégrales elliptiques complètes,
- $k^2$ est le module elliptique défini précédemment.
- Pour $r=0$, $A_\phi = 0$ par symétrie.

## Bobine de mesure

La bobine de mesure ne génère pas de champ magnétique. Elle est utilisée uniquement pour mesurer le flux magnétique induit.

### Flux magnétique

Le flux magnétique total à travers la bobine est :

$$
\Phi = N \int_S \mathbf{B}\cdot d\mathbf{S}
$$

Une approximation uniforme est utilisée :

$$
\Phi \simeq N\, B_y(x_0,y_0)\, \pi R^2
$$

### Loi de Faraday

La force électromotrice induite est donnée par :

$$
\mathcal{E} = -\frac{d\Phi}{dt}
$$

### Courant induit

En appliquant la loi d’Ohm :

$$
I_{\text{ind}} = \frac{\mathcal{E}}{R}
= -\frac{1}{R}\frac{d\Phi}{dt}
$$

## Dipôle magnétique

Le dipôle est modélisé par un moment magnétique ponctuel $\mathbf{m}$. Les objets aimant et corde sont modélisées respectivement comme des densités surfaciques et linéiques de dipoles élémentaires.

### Moment magnétique

$$
\mathbf{m} =

\begin{pmatrix}
m \cos\theta \\
m \sin\theta \\
0
\end{pmatrix}
$$

### Champ magnétique du dipôle

Pour un point d’observation :

$$
\mathbf{r} =
\begin{pmatrix}
x-x_0 \\
y-y_0 \\
0
\end{pmatrix},
\quad r = \|\mathbf{r}\|
$$

le champ magnétique est :

$$
\mathbf{B}(\mathbf{r}) =
\frac{\mu_0}{4\pi r^5}
(3(\mathbf{m}\cdot\mathbf{r})\mathbf{r}
- \mathbf{m} r^2)
$$


La perméabilité magnétique du vide étant : $\mu_0 = 4\pi \times 10^{-7}\ \mathrm{H\cdot m^{-1}}$. En projettant sur les composantes cartésiennes, on obtient :

$$
B_x =
\frac{\mu_0}{4\pi r^5}
\left(3(\mathbf{m}\cdot\mathbf{r})\,dx - m_x r^2\right)
$$

$$
B_y =
\frac{\mu_0}{4\pi r^5}
\left(3(\mathbf{m}\cdot\mathbf{r})\,dy - m_y r^2\right)
$$

### Potentiel vecteur du dipôle

Le potentiel vecteur est donné par :

$$
\mathbf{A}(\mathbf{r}) =
\frac{\mu_0}{4\pi}
\frac{\mathbf{m}\times\mathbf{r}}{r^3}
$$

Dans le plan $z=0$, seule la composante $A_z$ est non nulle :

$$
A_z =
\frac{\mu_0}{4\pi}
\frac{m_x\,dy - m_y\,dx}{r^3}
$$


## Corde 

La corde encastrée - encastrée est modélisée mécaniquement à partir de cette équation à 1 dimension :

$$
\rho\, \frac{\partial^2 u}{\partial t^2} = T\, \frac{\partial^2 u}{\partial x^2} - \gamma\, \frac{\partial u}{\partial t} + f(x, t)
$$

avec :  
- $\rho$ : la densité linéique de masse (kg/m)  
- $T$ : la tension exercée sur la corde (N)  
- $\gamma$ : le coefficient d'amortissement (kg/(m·s))  


La force par unité de longeur d'un champ magnétique extérieur sur des moments magnétiques $\mathbf{m}$ est : 

$$
\mathbf{f} = grad(\mathbf{m} \cdot \mathbf{B}) = \begin{pmatrix}
\frac{\partial (m_x B_x + m_y B_y)}{\partial x} \\
\frac{\partial (m_x B_x + m_y B_y)}{\partial y}  \\
\end{pmatrix}
$$

## Types de magnétisme :

### Diamagnétisme :

Propriété universelle : tout matériau est au moins diamagnétique. Des propriétés paramagnétiques ou ferromagnétiques supplémentaires peuvent se superposer. Si l'on plonge un matériau dans un champ magnétique extérieur, le mouvement orbital des électrons, formant donc des courants, sont induits sous l'influence de ce champ magnétique. Selon la règle de Lenz, ces courants sont dirigés de telle sorte qu'ils s'opposent à la cause qui les a créé. Les nuages électroniques vont donc créer des moments contraires à la direction du champ, et le matériau crée alors un faible champ opposé au champ externe. 

Caractéristiques :
- Toujours faiblement répulsif
- Aimantation induite très faible
- Disparaît quand le champ est coupé
- Susceptibilité magnétique négative : $χ < 0$


### Paramagnétisme

Le paramagnétisme est le type de magnétisme d'un milieu matériel qui n'est pas aimanté en l'absence d'un champ magnétique mais qui acquiert, sous l'effet d'un champ extérieur, une aimantation orientée dans le même sens que le champ : les moments magnétiques atomiques s’alignent partiellement avec le champ. Cette aimantation est perdue en l'absence de champs extérieur.

Caractéristiques :
- Faiblement attractif
- Aimantation proportionnelle au champ
- Disparaît quand le champ est coupé
- Susceptibilité magnétique positive faible : $χ \ll 1$


### Ferromagnétisme

Le ferromagnétisme désigne la capacité de certains corps à s'aimanter sous l'effet d'un champ magnétique extérieur et à garder une partie de cette aimantation. Forte interaction collective entre moments magnétiques. Formation de domaines magnétiques. Alignement spontané, même sans champ externe.
À température ambiante, seuls les éléments fer, nickel et cobalt (et leurs alliages (acier FeC ou ferrite Fe₃O₄)) sont ferromagnétiques. 

Caractéristiques :
- Fortement attractif
- Peut rester aimanté après coupure du champ (aimant permanent)
- Forte non-linéarité, hystérésis
- Susceptibilité magnétique positive élevée : $χ \gg 1$

L'aimantation de matériaux ferromagnétiques est partiellement conservée lorsque le champ magnétique extérieur est désactivé. Cette aimantation résiduelle est appelée rémanence. Un aimant permanent est toujours un matériau ferromagnétique, mais tous les matériaux ferromagnétiques ne sont pas des aimants permanents. Un aimant permanent est un matériau ferromagnétique avec une forte coercivité Hc (un cycle d'hystérésis large). Cette valeur Hc correspond à l'intensité du champ extérieur nécessaire pour désaimanter le matériau. Si elle est grande, l'aimantation peut être considérée comme permanente. 


### Relations :

Pour tout matériau, le champ total $B$ est la somme du champ extérieur $H$ et du champ généré par l'aimantation $M$ :

$$
B = μ_0(H+M)
$$

Le moment magnétique $m$ d’un aimant est définit à partir de son aimantation $M$ (A/m) et de son volume $V$  (m³) : 

$$
m = M × V
$$

Le moment magnétique total de tout système est la somme vectorielle de toutes les contributions quel que soit leur type. 

Un matériau diamagnétique ou paramagnétique sans champ extérieur a orientations aléatoires → $M=0$. Si un champs magnétique extérieur $H$ leur est appliqué, ils s’aimantent proportionnellement au champ. On a la relation linéaire : 

$$
M = χH
$$

On a donc :

$$
B = μ_0(H+M) = μ_0(1+χ)H = μH
$$

avec : $μ = μ_0(1+χ)$. La susceptibilité magnétique $χ$ mesure donc à quel point le matériau modifie le champ magnétique.

Cette formule n'est plus valable pour un matériau ferromagnétique, où il y a des non linéarités (hystérésis, saturation). Nous n'avons plus $M=M(H)$, mais plutôt $M=M(H, histoire)$, selon son cycle d'hystérésis. Quand le champ extérieur est très grand ($H \gg 0$), on a saturation de son aimantation : $M = M_s$. À l'inverse, quand le champ extérieur est nul ($H=0$), on a une aimantation rémanente : $M = M_r$. On a alors : 

$$
B = μ_0(H+M_{s/r})
$$



### Origine quantique : 

Les électrons individuels possèdent un spin S portant un moment magnétique. Le moment magnétique de spin d'un électron est
$$
{\displaystyle {\vec {\mu }}_{\mathrm {S} }=-{\frac {g_{\mathrm {S} }\mu _{\mathrm {B} }}{\hbar }}{\vec {S}}}
$$

où :
- ${\displaystyle \mu _{\mathrm {B} }}$ est le magnéton de Bohr, 
- ${\displaystyle {\vec {S}}}$ le spin de l'électron, 
- ${\displaystyle \hbar }$ la constante de Planck réduite,
- ${\displaystyle g_{\mathrm {S} }}$ le facteur de Landé (valant environ 2 dans le cas de l'électron).


Dans de nombreux matériaux, les électrons forment des orbitales électroniques en s'accociant par paires spin up et spin down. Leurs moments magnétiques s'annulent donc (par somme vectorielle). Ces matériaux sont alors diamagnétiques.

Si un atome possède un nombre impair d'électrons, les spins des électrons ne peuvent pas s'annuler par paires. Chaque atome possède alors un spin total résultant du dernier électron "non apparié" restant. Ces matériaux sont paramagnétiques ou ferromagnétiques. Les moments magnétiques atomiques des spins résultants sont par défaut répartis aléatoirement dans toutes les directions de l'espace en raison du mouvement des atomes, de sorte que les champs magnétiques de tous les moments élémentaires réunis se compensent mutuellement et que le matériau apparaisse non magnétique de l'extérieur. Cependant, dans un champ magnétique extérieur, les spins totaux résultants de tous les atomes s'alignent sur le champ (cf. modèle d'Ising). Dans ce cas, l'échantillon lui-même se comporte comme un aimant et est attiré par le champ magnétique extérieur. 

### Température 

À très haute température, tous les matériaux ferromagnétiques deviennent parmagnétiques, car l'énergie thermique des électrons est alors supérieure à l'interaction d'échange et l'alignement parallèle des spins des électrons est détruit. Il existe une température caractéristique propre à chaque matériau pour cette transition : la température de Curie. Elle vaut 769 °C pour le fer, 1127 °C pour le cobalt et 358 °C pour le nickel.

### Vie quotidienne

Les matériaux ferromagnétiques sont fortement attirés par les champs magnétiques. Ainsi, un aimant reste collé à une paroi en fer, qui est ferromagnétique, mais pas à une paroi en plastique, qui est généralement diamagnétique. Les courants circulaires à l'origine du diamagnétisme génèrent un champ plus faible dans des matériaux paramagnétiques et ferromagnétiques que les moments élémentaires alignés, de sorte que l'effet répulsif des courants circulaires induits est surpassé par l'effet attractif des aimants élémentaires alignés. L'interaction entre des champs magnétiques extérieurs et des matériaux paramagnétiques ou diamagnétiques est très faible, de sorte qu'elle n'est pas directement observable dans la vie quotidienne. Le pôle nord de tous les aimants élémentaires pointe alors en direction du pôle sud du champ extérieur et inversement. Le pole Nord géographique de la Terre correspond donc à un pole Sud magnétique. 




## TODO

Courant dans bobine peut avoir plusieurs formes (sin, triangle, step)  
https://chatgpt.com/c/697df73d-5208-8325-aa95-e0b53c0d229c  
 


## Problèmes

Meilleure modélisation de la bobine de mesure (champ moyen au centre)

Est ce qu'une simulation 2D est suffisante pour modéliser ces phénomènes ?

Le champ magnétique généré par les Magnets augmentent si on augmente la nombre de Dipoles à l'intérieur (n_x et n_y)

Les effets de saturation magnétique et de matériaux ferromagnétiques ne sont pas pris en compte.

Actuellement, les Dipoles de l'aimant ne changent pas de direction, alors que ceux de la corde s'alignent sur B, alors que ce sont tous les deux des matériaux ferro.
D'après GPT, il ne faut pas aligner les moments élémentaires (dipoles) sur le champ extérieur pour les aimants car l'aimantation rémanente est très grande (il faudrait un champ très fort pour les faire tourner). Cependant, il faut aligner les moments de la corde (matériau férromagnétique doux) car c'est une aimantation induite qui est donc sensible au champ B extérieur. La norme augmente jusqu'à saturation quand B aumgente : norm = m_sat * tanh(|B_local| / B0).
Quel est le temps nécessaire pour faire saturer les dm ? En régime dynamique, est ce que les dm ont le temps de faire -B -> +B ?
Est ce que la corde ne serait pas paramagnétique ? Comment faire pour déterminer cet aspect expérimentalement ?