<!DOCTYPE html>
<html>
	<head>
		<title>Kraland Click2Win</title>
        <meta charset="utf-8"/>
		<link rel="stylesheet" href="css/kraland.css">
		<script src="js/jquery2.js"></script>
		<script src="js/jquery-ui.js"></script>
		<script src="js/ui/helpers.js"></script>
		<script src="js/jeu/incrementalObject.js"></script>
		<script src="js/jeu/sets.js"></script>
		<script src="js/jeu/ordres.js"></script>
		<script src="js/jeu/kraland.js"></script>
	</head>
<body>
	<div id="header">
		<a name="top_page"></a>
		<div id="header-left"></div>
		<div id="header-right" style="width:234px">
		</div>
		<div id="header-central">
			<h1>Kraland Click2Win</h1><p>Enfin un moyen efficace de gagner KI.</p>
	</div></div>
	<div id="main">
		<div id="left">
			<div class="left-box">
				<table class="table-counters">
					<tbody>
						<tr>
							<td rowspan="2"><img src="http://dichra.free.fr/kraland/sims/img/redstar.jpg" width="40" height="40" alt="avatar"></a></td>
							<td class="tdbl"><img src="http://img.kraland.org/2/star.gif" width="16" height="16" alt="XP"></td><td>999</td>
						</tr>
						<tr>
							<td class="tdbl"><img src="http://img.kraland.org/2/heart.gif" width="16" height="16" alt="PdV"></td>
							<td><span id="pdv_value"></span></td>
						</tr>
						<tr>
							<td><img src="http://img.kraland.org/2/cyb/f1.png" width="20" height="13" alt="empire"> <img src="http://img.kraland.org/2/s1.gif" width="15" height="15" alt="homme"></td>
							<td class="tdbl"><img src="http://img.kraland.org/2/money.gif" width="16" height="16" alt="argent"></td>
							<td><span id="money_value"></span></td>
						</tr>
					</tbody>
				</table>
			</div>
			<table>
				<tbody>
					<tr>
						<th>Fonction</th>
						<th>PP</th>
					</tr>
					<tr>
						<td class="tdc"><span id="fonction_value"></span></td>
						<td class="tdmc"><span id="pp_value"></span></td>
					</tr>
				</tbody>
			</table>
			<table>
				<tbody>
					<tr>
						<th>Carrière</th>
						<td class="tdm">Abusator</td>
						<td class="tdmc">1</td>
					</tr>
					<tr>
						<th>Type</th>
						<td class="tdm">Rancunier</td>
						<td class="tdmc">1</td>
					</tr>
					<tr>
						<th>Politique</th>
						<td class="tdm">Pleureuse</td>
						<td class="tdmc">1</td>
					</tr>
					<tr>
						<th>Combat</th>
						<td class="tdm">TurboClic</td>
						<td class="tdmc">1</td>
					</tr>
					<tr>
						<th>Pouvoir</th>
						<td class="tdm">Kop1duStaf</td>
						<td class="tdmc">1</td>
					</tr>
				</tbody>
			</table>
			<table>
				<tbody>
					<tr>
						<th>FOR</th>
						<th>VOL</th>
						<th>CHA</th>
						<th>GES</th>
						<th>INT</th>
						<th>PER</th>
					</tr>
					<tr>
						<td class="tdc">6</td>
						<td class="tdc">6</td>
						<td class="tdc">6</td>
						<td class="tdc">6</td>
						<td class="tdc">6</td>
						<td class="tdc">6</td>
					</tr>
				</tbody>
			</table>
			<table>
				<tbody>
					<tr>
						<th colspan="2">COMPÉTENCES</th>
					</tr>
					<tr>
						<td class="tdm">Baratin</td><td class="tdmc">6</td>
					</tr>
					<tr>
						<td class="tdm">Combat Mains Nues</td><td class="tdmc">6</td>
					</tr>
					<tr>
						<td class="tdm">Combat Contact</td><td class="tdmc">6</td>
					</tr>
					<tr>
						<td class="tdm">Combat Distance</td><td class="tdmc">6</td>
					</tr>
					<tr>
						<td class="tdm">Commerce</td><td class="tdmc">6</td>
					</tr>
					<tr>
						<td class="tdm">Démolition</td><td class="tdmc">6</td>
					</tr>
					<tr>
						<td class="tdm">Discrétion</td><td class="tdmc">6</td>
					</tr>
					<tr>
						<td class="tdm">Éloquence</td><td class="tdmc">6</td>
					</tr>
					<tr>
						<td class="tdm">Falsification</td><td class="tdmc">6</td>
					</tr>
					<tr>
						<td class="tdm">Foi</td><td class="tdmc">6</td>
					</tr>
					<tr>
						<td class="tdm">Informatique</td><td class="tdmc">6</td>
					</tr>
					<tr>
						<td class="tdm">Médecine</td><td class="tdmc">6</td>
					</tr>
					<tr>
						<td class="tdm">Observation</td><td class="tdmc">6</td>
					</tr>
					<tr>
						<td class="tdm">Organisation</td><td class="tdmc">6</td>
					</tr>
					<tr>
						<td class="tdm">Pouvoir</td><td class="tdmc">6</td>
					</tr>
					<tr>
						<td class="tdm">Séduction</td><td class="tdmc">6</td>
					</tr>
					<tr>
						<td class="tdm">Survie</td><td class="tdmc">6</td>
					</tr>
					<tr>
						<td class="tdm">Vol</td><td class="tdmc">6</td>
					</tr>
				</tbody>
			</table>
		</div>

		<div id="central">
			<div id="central-content">
				<div id="div-min-height"></div>
				<div class="c">
					<div id="resultatJet"></div>
					<div id="tabs">
						<div class="sl">
							<ul>
								<li><a href="#tabs-mine">Miner</a></li>
								<li><a href="#tabs-ordre">Ordres</a></li>
								<li><a href="#tabs-pouch">La quincaillerie de pouch</a></li>
								<li><a href="#tabs-usurper">Usurper</a></li>
								<li><a href="#tabs-mules">Mules</a></li>
								<li><a href="#tabs-maj">Scripts de MAJ</a></li>
							</ul>
						</div>

						<div id="tabs-mine" class="tab-container">
							<h3>Complexe minier d'Or du quartier sur les os</h3>
							<p>Ramasse du fric pour te sortir de la zère-mi.</p>
							<div id="clicker">
								<img src="http://img.kraland.org/2/map/4/3074.gif"><br>
								<span>&nbsp;Miner comme un prolo&nbsp;</span>
							</div>
						</div>
						<div id="tabs-ordre" class="tab-container">
							<h3>Passer un ordre</h3>
							<p>N'oubliez jamais que les abus de quelques uns peuvent compromettre <em>[message brouillé]</em></p>

							<div id="available_ordres">
								<p class="menu_ordres">
									
								</p>
							</div>
						</div>
						<div id="tabs-usurper" class="tab-container">
							<h3>Usurper vos semblables</h3>
							<p>Voici les différents boutons de l'ascenseur social</p>
							<!-- mon anglais déchiiiiire -->
							<div id="available_usurping">
								<p>Sélectionner la victime de votre usurpation</p>
								<p class="menu_ordres">
									
								</p>
							</div>
						</div>
						<div id="tabs-mules" class="tab-container">
							<h3>AdopteUneMule.com</h3>
							<p>La mule est le meilleur ami de l'homme puissant</p>
							<div id="available_mules"></div>
						</div>
						<div id="tabs-maj" class="tab-container">
							<h3>MAJ mieux que ça</h3>
							<p>Avec tout ça, tu devrais passer chaque MAJ avec +20 dans toutes les jauges</p>
							<div id="available_regen"></div>
						</div>
						<div id="tabs-pouch" class="tab-container">
							<h3>Boutique réservée aux faces de cul seulement</h3>
							<p>Vous pouvez demander au gérant de vous montrer ses bobettes à l'effigie de la grandeur de la Russie</p>
							<div id="available_pioches"></div>
						</div>
					</div>
				</div>
			</div>
			<div id="div-min-height-bottom"></div>
		</div>

		<div id="right">
			<div class="right-box">
				<div class="right-boxprofile-img">
					<div class="right-boxprofile-header">PROFIL</div>
						<div class="right-boxprofile-content">
							<p class="right-boxprofile-name" style="white-space:nowrap;">raid<img src="http://img.kraland.org/s/4C.gif" align="middle">staw</p>
							<div class="divider"></div>
							<table>
								<tbody>
									<tr>
										<th colspan="2">STATISTIQUES</th>
									</tr>
									<tr>
										<td class="tdm">FK par clic.</td><td class="tdmc"><span id="perClick"></span></td>
									</tr>
									<tr>
										<td class="tdm">FK/sec.</td><td class="tdmc"><span id="perSecond"></span></td>
									</tr>
									<tr>
										<td class="tdm">PdV Max.</td><td class="tdmc"><span id="pdvmax_value"></span></td>
									</tr>
									<tr>
										<td class="tdm">PdV/sec.</td><td class="tdmc"><span id="pdvpersecond"></span></td>
									</tr>
									<tr>
										<td class="tdm">PP/sec.</td><td class="tdmc"><span id="ppPerSecond_value"></span></td>
									</tr>
									<tr>
										<td class="tdm">Facteur Chance</td><td class="tdmc">+<span id="facteurChance"></span></td>
									</tr>
								</tbody>
							</table>
						</div>
					</div>
			</div>
		</div>

		<div id="foot">
			<p class="c"><a href="https://github.com/rachids/Kraland-Click2Win" target="_blank">Code source</a> | Généré en 0.02 sec. | DefKra 93 | <a href="#top_page">Retour en haut de page</a> | 10 juil 13:37</p>
		</div>
	</div>
</body>	
</html>