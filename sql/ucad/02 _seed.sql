-- ==========================================
-- DONNEES INITIALES - SITE UCAD
-- ==========================================

-- AUTEURS (identiques sur tous les sites)

INSERT INTO auteur (id_aut, nom_auteur) VALUES
(1,'Victor Hugo'),
(2,'Léopold Sédar Senghor'),
(3,'Cheikh Hamidou Kane'),
(4,'Mariama Bâ'),
(5,'Albert Camus'),
(6,'Aimé Césaire'),
(7,'Chinua Achebe'),
(8,'Ngũgĩ wa Thiong''o');

-- EMPLOYES

INSERT INTO employe (nom, adresse, statut, bibliotheque) VALUES
('Aminata Gueye','Dakar','Bibliothécaire','UCAD'),
('Cheikh Diouf','Dakar','Gestionnaire','UCAD'),
('Seynabou Faye','Dakar','Archiviste','UCAD'),
('Papa Mbaye','Dakar','Responsable','UCAD');

-- ETUDIANTS

INSERT INTO etudiant
(nom, adresse, universite, specialite, nbre_emprunts)
VALUES
('Abdou Aziz','Dakar','UCAD','Médecine',0),
('Marième Sow','Dakar','UCAD','Droit',1),
('Serigne Fall','Dakar','UCAD','Économie',2),
('Astou Ndiaye','Dakar','UCAD','Informatique',0),
('Boubacar Diop','Dakar','UCAD','Gestion',3),
('Test Limite','Dakar','UCAD','Informatique',5);

-- OUVRAGES

INSERT INTO ouvrage
(titre,id_auteur,editeur,annee,domaine,stock,site)
VALUES
('Le Dernier Jour d''un Condamné',1,'Hachette',1829,'Roman',3,'UCAD'),
('Les Contemplations',1,'Larousse',1856,'Poésie',2,'UCAD'),
('Nations Nègres et Culture',2,'Présence Africaine',1954,'Histoire',5,'UCAD'),
('Le Baobab Fou',4,'NEA',1982,'Roman',2,'UCAD'),
('La Peste',5,'Gallimard',1947,'Roman',1,'UCAD'),
('Cahier d''un retour au pays natal',6,'Présence Africaine',1939,'Poésie',3,'UCAD'),
('No Longer at Ease',7,'Heinemann',1960,'Roman',4,'UCAD'),
('Decolonising the Mind',8,'Heinemann',1986,'Littérature',2,'UCAD'),
('Réseaux Informatiques',2,'Eyrolles',2021,'Informatique',5,'UCAD'),
('Systèmes Distribués',2,'Dunod',2023,'Informatique',3,'UCAD');