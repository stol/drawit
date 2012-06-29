var app = require('http').createServer(handler)
  , io = require('socket.io').listen(app)
  , fs = require('fs')
  , _  = require('underscore')
  , mots

io.set('log level', 0)
var connections_nb = 0;

app.listen(3000);

function handler (req, res) {
    fs.readFile(__dirname + '/index.html',
    function (err, data) {
    if (err) {
      res.writeHead(500);
      return res.end('Error loading index.html');
    }

    res.writeHead(200);
    res.end(data);
  });
}

var users = {}
var TIME_MAX = 60;

var timer = 0;
var time_counter = 0;
var mot;
io.sockets.on('connection', function (socket) {

  if (!users[socket.id]){
    socket.pseudo = "ano_"+socket.id.substr(0,5)
    users[socket.id] = {
      id: socket.id,
      pseudo: socket.pseudo,
      score: 0
    }
  }

  io.sockets.emit('pseudos', users);
  
  if (mot){
    socket.emit('updateTimer', {time: TIME_MAX-time_counter});
  }

  socket.on('drawLine', function (data) {
    socket.broadcast.emit('drawLine', data);
  });

  socket.on('chat', function (data) {
    var response = {
      input_text: data.input_text,
      pseudo: users[socket.id].pseudo
    }

    io.sockets.emit('chat', response);

    // Le mot a été trouvé ?
    if (mot && data.input_text == mot)
    {
      console.log("mot trouvé par "+users[socket.id].pseudo)
      io.sockets.emit('broadcast', {msg:'Le mot était "'+mot+'", trouvé par '+users[socket.id].pseudo});
      users[socket.id].score++;
      users[drawer_id].score+=2;
      io.sockets.emit('endGame', {
        mot: mot,
        winner: users[socket.id].pseudo
      });
      io.sockets.emit('pseudos', users);

      clearInterval(timer);
      timer = 0;
      mot = 0;
      drawer_id = 0;

    }

  });

  socket.on('pseudo', function (data) {
    socket.pseudo = data.pseudo
    users[socket.id].pseudo = socket.pseudo
    io.sockets.emit('pseudos', users);
  });

  socket.on('start', function (data) {
    if (timer)
      return;
    mot = mots[Math.floor(Math.random()*(mots.length+1))];
    console.log("mot = "+mot);
    drawer_id = socket.id;
    socket.broadcast.emit('startAsGuesser', {drawer: users[socket.id].pseudo});
    socket.emit('startAsDrawer', {
      mot : mot
    });
    time_counter = 0;

    timer = setInterval(function(){
      time_counter++;
      if (time_counter > TIME_MAX){
        if (mot){
          clearInterval(timer);
          timer = 0;
          io.sockets.emit('endGame', {mot: mot});
          mot = 0;
          drawer_id = 0;
        }
        return false;
      }
      io.sockets.emit('updateTimer', {time: TIME_MAX-time_counter});
      
    },1000)
  });



  socket.on('disconnect', function () {
    if (!socket.pseudo) return;

    delete users[socket.id];
    io.sockets.emit('pseudos', users);
  });
});




mots = ['abricot','ail','aliment','ananas','banane','bifteck','café','carotte','cerise','chocolat','chou','citron','citrouille','clémentine','concombre','coquillage','corbeille','crabe','crevette','endive','farine','fraise','framboise','fromage','fruit','gâteau','haricot','huile','légume','marchand','melon','monnaie','navet','noisette','noix','nourriture','oignon','orange','panier','pâtes','pêche','persil','petit pois','poire','poireau','pomme','pomme de terre','prix','prune','queue','raisin','riz','salade','sucre','thé','tomate','viande','vin','adresse','appartement','ascenseur','balcon','boucherie','boulanger','boulangerie','boutique','bus','caniveau','caravane','carrefour','cave','charcuterie','cinéma','cirque','clin d’œil','cloche','clocher','clown','coiffeur','colis-route','courrier','croix','église','embouteillage','endroit','enveloppe','essence','facteur','fleuriste','foire','hôpital','hôtel','immeuble','incendie','laisse','magasin','manège','médicament','moineau','monde','monument','ouvrier','palais','panneau','paquet','parc','passage','pharmacie','pharmacien','piscine','place','police','policier','pompier','poste','promenade','quartier','square','timbre','travaux','usine','village','ville','voisin','volet','bûche','buisson','camp','chasseur','châtaigne','chemin','chêne','corbeau','écorce','écureuil','forêt','gourde','lac','loupe','lutin','marron','mûre','moustique','muguet','nid','paysage','pin','rocher','sapin','sommet','tente','billet','caisse','farce','grimace','grotte','pays','regard','ticket','araignée','brouette','chenille','coccinelle','fourmi','herbe','jonquille','lézard','pâquerette','rangée','râteau','rosé','souris','taupe','terrain','terre','terrier','tige','ver','ambulance','bosse','champignon','dentiste','docteur','fièvre','front','gorge','infirmier','infirmière','jambe','larme','médecin','menton','mine','ordonnance','pansement','peau','piqûre','poison','sang','santé','squelette','trousse','adulte','album','amour','baiser','bavoir','biberon','bisou','caprice','cimetière','cousin','cousine','crèche','fils','frère','grand-parent','homme','jumeau','maman','mari','mariage','mère','papa','parent','père','petit-enfant','petit-fils','petite-fille','rasoir','sœur','argent','aspirateur','bague','barrette','bijou','bracelet','brosse','cadre','canapé','chambre','cheveu','chiffon','cil','coffre','coffret','collier','couette','coussin','couverture','dent','dentifrice','drap','fauteuil','fer à repasser','frange','glace','lampe','lit','ménage','or','oreiller','parfum','peigne','pouf','poupée','poussette','poussière','shampoing','sourcil','trésor','tube','vase','assiette','balai','biscuit','boisson','bol','bonbon','céréale','confiture','coquetier','couteau','couvercle','couvert','cuillère','cuisine','cuisinière','désordre','dînette','éponge','évier','four','fourchette','lait','lave-linge','lessive','machine','nappe','pain','pile','plat','plateau','poêle','réfrigérateur','repas','tartine','torchon','vaisselle','air','arc-en-ciel','brouillard','ciel','éclair','flocon','goutte','hirondelle','luge','neige','nuage','orage','ouragan','parapluie','parasol','ski','tempête','thermomètre','tonnerre','traîneau','vent','âge','an','année','après-midi','calendrier','début','dimanche','été','étoile','fin','heure des mamans','heure','hiver','horloge','jeudi','jour','journée','lumière','lundi','lune','mardi','matin','mercredi','midi','minuit','minute','mois','moment','montre','nuit','ombre','pendule','retour','réveil','saison','samedi','semaine','soir','soleil','temps','univers','vacances','vendredi','Noël','boule','cadeau','canne à pêche','chance','cube','guirlande','humeur','papillon','spectacle','surprise','trou','visage','épingle','bâton','bêtise','bonhomme','bottes','canne','cauchemar','cri','danse','déguisement','dinosaure','drapeau','en argent','en or','en rang','fête','figure','géant','gens','grand-mère','grand-père','joie','joue','journaux','maquillage','masque','monsieur','moustache','ogre','princesse','rue','trottoir','aigle','animaux','aquarium','bêtes','cerf','chouette','cigogne','crocodile','dauphin','éléphant','girafe','hibou','hippopotame','kangourou','lion','loup','ours','panda','panthère','perroquet','phoque','renard','requin','rhinocéros','singe','tigre','zèbre','zoo','légume','abeille','agneau','aile','âne','arbre','bain','barque','bassin','bébé','bec','bête','bœuf','botte de foin','boue','bouquet','bourgeon','branche','caillou','campagne','car','champ','chariot','chat','cheminée','cheval','chèvre','chien','cochon','colline','coq','coquelicot','crapaud','cygne','départ','dindon','escargot','étang','ferme','fermier','feuille','flamme','fleur','fontaine','fumée','grain','graine','grenouille','griffe','guêpe','herbe','hérisson','insecte','jardin','mare','marguerite','miel','morceau de pain','mouche','mouton','oie','oiseau','pierre','pigeon','plante','plume','poney','poule','poussin','prairie','rat','rivière','route','tortue','tracteur','tulipe','vache','vétérinaire','animal','bébés','bouche','cage','câlin','caresse','cochon d’Inde','foin','graines','hamster','lapin','maison','nez','œil','oreille','patte','toit','yeux','arête','femme','frite','gobelet','jambon','os','poulet','purée','radis','restaurant','sole','bassine','cocotte','épluchure','légume','pomme de terre','rondelle','soupe','consommé','potage','glaçon','jus','kiwi','lame','mûre','noyau','paille','pamplemousse','râpe','allumette','anniversaire','appétit','beurre','coquille','crêpes','croûte','dessert','envie','faim','fève','four','galette','gâteau','goût','invitation','langue','lèvres','liquide','louche','mie','moitié','moule','odeur','œuf','part','pâte','pâtisserie','recette','rouleau','sel','soif','tarte','tranche','yaourt','bagarre','balançoire','ballon','bande','bicyclette','bille','cadenas','cage à écureuil','cerf-volant','château','coup','cour','course','échasse','flaque','paix','pardon','partie','pédale','pelle','pompe','préau','raquette','rayon','récréation','sable','sifflet','signe','tas','tricycle','tuyau','vélo','filet','acrobate','arrêt','arrière','barre','barreau','bord','bras','cerceau','chaises','cheville','chute','cœur','corde','corps','côté','cou','coude','cuisse','danger','doigts','dos','échasses','échelle','épaule','équipe','escabeau','fesse','filet','fond','genou','gymnastique','hanche','jambes','jeu','mains','milieu','montagne','mur d’escalade','muscle','numéro','ongle','parcours','pas','passerelle','pente','peur','pieds','plongeoir','poignet','poing','pont de singe','poutre d’équilibre','prises','rivière des crocodiles','roulade','saut','serpent','sport','suivant','tête','toboggan','tour','trampoline','tunnel','ventre','accident','aéroport','auto','camion','engin','feu','frein','fusée','garage','gare','grue','hélicoptère','moto','panne','parking','pilote','pneu','quai','train','virage','vitesse','voyage','wagon','zigzag','aiguille','ampoule','avion','bois','bout','bricolage','bruit','cabane','carton','clou','colle','crochet','élastique','ficelle','fil','marionnette','marteau','métal','mètre','morceau','moteur','objet','outil','peinture','pinceau','planche','plâtre','scie','tournevis','vis','voiture','véhicule','arrosoir','assiette','balle','bateau','boîte','bouchon','bouteille','bulles','canard','casserole','cuillère','cuvette','douche','entonnoir','gouttes','litre','moulin','pluie','poisson','pont','pot','roue','sac en plastique','saladier','seau','tablier','tasse','trous','verre','ami','attention','camarade','colère','copain','coquin','dame','directeur','directrice','droit','effort','élève','enfant','fatigue','faute','fille','garçon','gardien','madame','maître','maîtresse','mensonge','ordre','personne','retard','sourire','travail','crayon','stylo','feutre','taille-crayon','pointe','mine','gomme','dessin','coloriage','rayure','peinture','pinceau','couleur','craie','papier','feuille','cahier','carnet','carton','ciseaux','découpage','pliage','pli','colle','affaire','boîte','casier','caisse','trousse','cartable','jouet','jeu','pion','dé','domino','puzzle','cube','perle','chose','forme : carré','rond','pâte à modeler','tampon','livre','histoire','bibliothèque','image','album','titre','bande dessinée','conte','dictionnaire','magazine','catalogue','page','ligne','mot','enveloppe','étiquette','carte d’appel : affiche','alphabet','appareil','caméscope','cassette','cédé','cédérom','chaîne','chanson','chiffre','contraire','différence','doigt','écran','écriture','film','fois','idée','instrument','intrus','lettre','liste','magnétoscope','main','micro','modèle','musique','nom','nombre','orchestre','ordinateur','photo','point','poster','pouce','prénom','question','radio','sens','tambour','télécommande','téléphone','télévision','trait','trompette','voix','xylophone','zéro','angle','armoire','banc','bureau','cabinet','carreau','chaise','classe','clé','coin','couloir','dossier','eau','école','écriture','entrée','escalier','étagère','étude','extérieur','fenêtre','intérieur','lavabo','lecture','lit','marche','matelas','maternelle','meuble','mousse','mur','peluche','placard','plafond','porte','portemanteau','poubelle','radiateur','rampe','récréation','rentrée','rideau','robinet','salle','savon','serrure','serviette','siège','sieste','silence','sol','sommeil','sonnette','sortie','table','tableau','tabouret','tapis','tiroir','toilette','vitre','w.-c.'];