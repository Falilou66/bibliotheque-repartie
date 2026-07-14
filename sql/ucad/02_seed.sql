-- ==========================================
-- DONNEES INITIALES - SITE UCAD
-- ==========================================
-- Convention d'ids : UCAD -> etudiant 101..199 / ouvrage 101..199 (cf. §2.4)
--
-- SET NAMES utf8mb4 : évite la corruption des caractères accentués (le
-- client mysql utilisé par docker-entrypoint-initdb.d retombe sinon sur
-- latin1 par défaut).
SET NAMES utf8mb4;

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

-- login / mot_de_passe : authentification locale des employés (démo : biblio123)
INSERT INTO employe (nom, adresse, statut, bibliotheque, login, mot_de_passe) VALUES
('Aminata Gueye','Dakar','Bibliothécaire','UCAD','aminata','biblio123'),
('Cheikh Diouf','Dakar','Gestionnaire','UCAD','cheikh','biblio123'),
('Seynabou Faye','Dakar','Archiviste','UCAD','seynabou','biblio123'),
('Papa Mbaye','Dakar','Responsable','UCAD','papa','biblio123');

-- ETUDIANTS (ids 101..199)

INSERT INTO etudiant
(id_etud, nom, adresse, universite, specialite, nbre_emprunts)
VALUES
(101,'Abdou Aziz','Dakar','UCAD','Médecine',0),
(102,'Marième Sow','Dakar','UCAD','Droit',1),
(103,'Serigne Fall','Dakar','UCAD','Économie',2),
(104,'Astou Ndiaye','Dakar','UCAD','Informatique',0),
(105,'Boubacar Diop','Dakar','UCAD','Gestion',3),
(106,'Test Limite','Dakar','UCAD','Informatique',5);

-- OUVRAGES (ids 101..199)

INSERT INTO ouvrage
(id_ouv,titre,id_auteur,editeur,annee,domaine,stock,site)
VALUES
(101,'Le Dernier Jour d''un Condamné',1,'Hachette',1829,'Roman',3,'UCAD'),
(102,'Les Contemplations',1,'Larousse',1856,'Poésie',2,'UCAD'),
(103,'Nations Nègres et Culture',2,'Présence Africaine',1954,'Histoire',5,'UCAD'),
(104,'Le Baobab Fou',4,'NEA',1982,'Roman',2,'UCAD'),
(105,'La Peste',5,'Gallimard',1947,'Roman',1,'UCAD'),
(106,'Cahier d''un retour au pays natal',6,'Présence Africaine',1939,'Poésie',3,'UCAD'),
(107,'No Longer at Ease',7,'Heinemann',1960,'Roman',4,'UCAD'),
(108,'Decolonising the Mind',8,'Heinemann',1986,'Littérature',2,'UCAD'),
(109,'Réseaux Informatiques',2,'Eyrolles',2021,'Informatique',5,'UCAD'),
(110,'Systèmes Distribués',2,'Dunod',2023,'Informatique',3,'UCAD');
