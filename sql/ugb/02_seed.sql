-- ==========================================
-- DONNEES INITIALES - SITE UGB
-- ==========================================
--
-- SET NAMES utf8mb4 : force la session du client mysql (docker-entrypoint-
-- initdb.d) à traiter ce fichier comme de l'UTF-8, sinon le client retombe
-- sur latin1 par défaut et les caractères accentués sont corrompus (double
-- encodage UTF-8) en écriture dans les colonnes utf8mb4.
SET NAMES utf8mb4;
--
-- Convention d'identifiants (disjonction des clés entre sites, cf. §2.4) :
--   UGB  : etudiant 1..99    / ouvrage 1..99
--   UCAD : etudiant 101..199 / ouvrage 101..199
--   UADB : etudiant 201..299 / ouvrage 201..299
-- Indispensable pour que le routage inter-sites (etudiant_global) et le
-- compteur global d'emprunts (H4) identifient un étudiant de façon unique.

-- ==========================================
-- AUTEURS (identiques sur les 3 sites -> réplication)
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

-- login / mot_de_passe : authentification locale des employés (démo : biblio123)
INSERT INTO employe (nom, adresse, statut, bibliotheque, login, mot_de_passe) VALUES
('Awa Ndiaye','Saint-Louis','Bibliothécaire','UGB','awa','biblio123'),
('Mamadou Fall','Saint-Louis','Gestionnaire','UGB','mamadou','biblio123'),
('Fatou Diop','Saint-Louis','Archiviste','UGB','fatou','biblio123'),
('Ousmane Ba','Saint-Louis','Responsable','UGB','ousmane','biblio123');

-- ==========================================
-- ETUDIANTS (ids 1..99)
-- ==========================================

INSERT INTO etudiant
(id_etud, nom, adresse, universite, specialite, nbre_emprunts)
VALUES
(1,'Amadou Sow','Saint-Louis','UGB','Informatique',0),
(2,'Khady Ndiaye','Saint-Louis','UGB','Mathématiques',1),
(3,'Ibrahima Diallo','Saint-Louis','UGB','Physique',2),
(4,'Fatou Ba','Saint-Louis','UGB','Chimie',0),
(5,'Moussa Fall','Saint-Louis','UGB','Réseaux',3),
(6,'Test Limite','Saint-Louis','UGB','Informatique',4);

-- ==========================================
-- OUVRAGES (ids 1..99)
-- ==========================================

INSERT INTO ouvrage
(id_ouv,titre,id_auteur,editeur,annee,domaine,stock,site)
VALUES
(1,'Les Misérables',1,'Hachette',1862,'Roman',5,'UGB'),
(2,'Notre-Dame de Paris',1,'Larousse',1831,'Roman',3,'UGB'),
(3,'L''Aventure ambiguë',3,'Présence Africaine',1961,'Littérature',4,'UGB'),
(4,'Une si longue lettre',4,'NEA',1979,'Roman',2,'UGB'),
(5,'L''Étranger',5,'Gallimard',1942,'Philosophie',1,'UGB'),
(6,'Discours sur le colonialisme',6,'Présence Africaine',1955,'Histoire',3,'UGB'),
(7,'Things Fall Apart',7,'Heinemann',1958,'Roman',2,'UGB'),
(8,'Petals of Blood',8,'Penguin',1977,'Roman',4,'UGB'),
(9,'Algorithmique',2,'Ellipses',2022,'Informatique',5,'UGB'),
(10,'Base de données réparties',2,'Dunod',2024,'Informatique',2,'UGB');
