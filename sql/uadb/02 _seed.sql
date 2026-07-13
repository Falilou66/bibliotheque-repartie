-- ==========================================
-- DONNEES INITIALES - SITE UADB
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

INSERT INTO employe (nom, adresse, statut, bibliotheque) VALUES
('Mouhamed Sarr','Bambey','Bibliothécaire','UADB'),
('Aissatou Diallo','Bambey','Gestionnaire','UADB'),
('Abdoulaye Seck','Bambey','Archiviste','UADB'),
('Rokhaya Sy','Bambey','Responsable','UADB');

INSERT INTO etudiant
(nom, adresse, universite, specialite, nbre_emprunts)
VALUES
('Aliou Kane','Bambey','UADB','SI',0),
('Mame Diarra','Bambey','UADB','Réseaux',2),
('Ibrahima Sarr','Bambey','UADB','Télécom',1),
('Sokhna Fall','Bambey','UADB','Développement',0),
('Cheikh Ba','Bambey','UADB','Cloud',3),
('Test Limite','Bambey','UADB','SI',5);

INSERT INTO ouvrage
(titre,id_auteur,editeur,annee,domaine,stock,site)
VALUES
('Demain dès l''aube',1,'Hachette',1856,'Poésie',3,'UADB'),
('Hosties Noires',2,'Présence Africaine',1948,'Poésie',4,'UADB'),
('L''Enfant Noir',3,'Plon',1953,'Roman',2,'UADB'),
('Scarlet Song',4,'Longman',1981,'Roman',3,'UADB'),
('La Chute',5,'Gallimard',1956,'Roman',1,'UADB'),
('Toussaint Louverture',6,'Présence Africaine',1961,'Histoire',5,'UADB'),
('Arrow of God',7,'Heinemann',1964,'Roman',2,'UADB'),
('Wizard of the Crow',8,'Vintage',2006,'Roman',3,'UADB'),
('Programmation Python',2,'ENI',2022,'Informatique',4,'UADB'),
('Administration Oracle',2,'ENI',2024,'Base de données',2,'UADB');