-- ==========================================
-- DONNEES INITIALES - SITE UGB
-- ==========================================

-- ==========================================
-- AUTEURS (identiques sur les 3 sites)
-- ==========================================

INSERT INTO auteur (id_aut, nom_auteur) VALUES
(1,'Victor Hugo'),
(2,'Léopold Sédar Senghor'),
(3,'Cheikh Hamidou Kane'),
(4,'Mariama Bâ'),
(5,'Albert Camus'),
(6,'Aimé Césaire'),
(7,'Chinua Achebe'),
(8,'Ngũgĩ wa Thiong''o');

-- ==========================================
-- EMPLOYES
-- ==========================================

INSERT INTO employe (nom, adresse, statut, bibliotheque) VALUES
('Awa Ndiaye','Saint-Louis','Bibliothécaire','UGB'),
('Mamadou Fall','Saint-Louis','Gestionnaire','UGB'),
('Fatou Diop','Saint-Louis','Archiviste','UGB'),
('Ousmane Ba','Saint-Louis','Responsable','UGB');

-- ==========================================
-- ETUDIANTS
-- ==========================================

INSERT INTO etudiant
(nom, adresse, universite, specialite, nbre_emprunts)
VALUES
('Amadou Sow','Saint-Louis','UGB','Informatique',0),
('Khady Ndiaye','Saint-Louis','UGB','Mathématiques',1),
('Ibrahima Diallo','Saint-Louis','UGB','Physique',2),
('Fatou Ba','Saint-Louis','UGB','Chimie',0),
('Moussa Fall','Saint-Louis','UGB','Réseaux',3),
('Test Limite','Saint-Louis','UGB','Informatique',4);

-- ==========================================
-- OUVRAGES
-- ==========================================

INSERT INTO ouvrage
(titre,id_auteur,editeur,annee,domaine,stock,site)
VALUES
('Les Misérables',1,'Hachette',1862,'Roman',5,'UGB'),
('Notre-Dame de Paris',1,'Larousse',1831,'Roman',3,'UGB'),
('L''Aventure ambiguë',3,'Présence Africaine',1961,'Littérature',4,'UGB'),
('Une si longue lettre',4,'NEA',1979,'Roman',2,'UGB'),
('L''Étranger',5,'Gallimard',1942,'Philosophie',1,'UGB'),
('Discours sur le colonialisme',6,'Présence Africaine',1955,'Histoire',3,'UGB'),
('Things Fall Apart',7,'Heinemann',1958,'Roman',2,'UGB'),
('Petals of Blood',8,'Penguin',1977,'Roman',4,'UGB'),
('Algorithmique',2,'Ellipses',2022,'Informatique',5,'UGB'),
('Base de données réparties',2,'Dunod',2024,'Informatique',2,'UGB');