-- ==========================================
-- DONNEES INITIALES - SITE UADB
-- ==========================================
-- Convention d'ids : UADB -> etudiant 201..299 / ouvrage 201..299 (cf. §2.4)

INSERT INTO auteur (id_aut, nom_auteur) VALUES
(1,'Victor Hugo'),
(2,'Léopold Sédar Senghor'),
(3,'Cheikh Hamidou Kane'),
(4,'Mariama Bâ'),
(5,'Albert Camus'),
(6,'Aimé Césaire'),
(7,'Chinua Achebe'),
(8,'Ngũgĩ wa Thiong''o');

-- login / mot_de_passe : authentification locale des employés (démo : biblio123)
INSERT INTO employe (nom, adresse, statut, bibliotheque, login, mot_de_passe) VALUES
('Mouhamed Sarr','Bambey','Bibliothécaire','UADB','mouhamed','biblio123'),
('Aissatou Diallo','Bambey','Gestionnaire','UADB','aissatou','biblio123'),
('Abdoulaye Seck','Bambey','Archiviste','UADB','abdoulaye','biblio123'),
('Rokhaya Sy','Bambey','Responsable','UADB','rokhaya','biblio123');

-- ETUDIANTS (ids 201..299)

INSERT INTO etudiant
(id_etud, nom, adresse, universite, specialite, nbre_emprunts)
VALUES
(201,'Aliou Kane','Bambey','UADB','SI',0),
(202,'Mame Diarra','Bambey','UADB','Réseaux',2),
(203,'Ibrahima Sarr','Bambey','UADB','Télécom',1),
(204,'Sokhna Fall','Bambey','UADB','Développement',0),
(205,'Cheikh Ba','Bambey','UADB','Cloud',3),
(206,'Test Limite','Bambey','UADB','SI',5);

-- OUVRAGES (ids 201..299)

INSERT INTO ouvrage
(id_ouv,titre,id_auteur,editeur,annee,domaine,stock,site)
VALUES
(201,'Demain dès l''aube',1,'Hachette',1856,'Poésie',3,'UADB'),
(202,'Hosties Noires',2,'Présence Africaine',1948,'Poésie',4,'UADB'),
(203,'L''Enfant Noir',3,'Plon',1953,'Roman',2,'UADB'),
(204,'Scarlet Song',4,'Longman',1981,'Roman',3,'UADB'),
(205,'La Chute',5,'Gallimard',1956,'Roman',1,'UADB'),
(206,'Toussaint Louverture',6,'Présence Africaine',1961,'Histoire',5,'UADB'),
(207,'Arrow of God',7,'Heinemann',1964,'Roman',2,'UADB'),
(208,'Wizard of the Crow',8,'Vintage',2006,'Roman',3,'UADB'),
(209,'Programmation Python',2,'ENI',2022,'Informatique',4,'UADB'),
(210,'Administration Oracle',2,'ENI',2024,'Base de données',2,'UADB');
