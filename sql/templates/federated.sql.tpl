-- ======================================================
-- FEDERATED TABLES + VUES GLOBALES
-- Les variables seront remplacées par setup_federated.sh
--
-- @PEER1@
-- @PEER2@
-- @HOST1@
-- @HOST2@
-- @PASSWORD@
-- ======================================================

-- ======================================================
-- ETUDIANTS
-- ======================================================

DROP TABLE IF EXISTS ft_etudiant_@PEER1@;
DROP TABLE IF EXISTS ft_etudiant_@PEER2@;

CREATE TABLE ft_etudiant_@PEER1@ (
    id_etud INT,
    nom VARCHAR(120) NOT NULL,
    adresse VARCHAR(200),
    universite VARCHAR(10) NOT NULL,
    specialite VARCHAR(80),
    nbre_emprunts INT NOT NULL
) ENGINE=FEDERATED
CONNECTION='mysql://biblio:@PASSWORD@@HOST1@:3306/biblio/etudiant';

CREATE TABLE ft_etudiant_@PEER2@ (
    id_etud INT,
    nom VARCHAR(120) NOT NULL,
    adresse VARCHAR(200),
    universite VARCHAR(10) NOT NULL,
    specialite VARCHAR(80),
    nbre_emprunts INT NOT NULL
) ENGINE=FEDERATED
CONNECTION='mysql://biblio:@PASSWORD@@HOST2@:3306/biblio/etudiant';

-- ======================================================
-- OUVRAGES
-- ======================================================

DROP TABLE IF EXISTS ft_ouvrage_@PEER1@;
DROP TABLE IF EXISTS ft_ouvrage_@PEER2@;

CREATE TABLE ft_ouvrage_@PEER1@ (
    id_ouv INT,
    titre VARCHAR(200) NOT NULL,
    id_auteur INT NOT NULL,
    editeur VARCHAR(120),
    annee INT,
    domaine VARCHAR(60),
    stock INT NOT NULL,
    site VARCHAR(10) NOT NULL
) ENGINE=FEDERATED
CONNECTION='mysql://biblio:@PASSWORD@@HOST1@:3306/biblio/ouvrage';

CREATE TABLE ft_ouvrage_@PEER2@ (
    id_ouv INT,
    titre VARCHAR(200) NOT NULL,
    id_auteur INT NOT NULL,
    editeur VARCHAR(120),
    annee INT,
    domaine VARCHAR(60),
    stock INT NOT NULL,
    site VARCHAR(10) NOT NULL
) ENGINE=FEDERATED
CONNECTION='mysql://biblio:@PASSWORD@@HOST2@:3306/biblio/ouvrage';

-- ======================================================
-- PRETS
-- ======================================================

DROP TABLE IF EXISTS ft_pret_@PEER1@;
DROP TABLE IF EXISTS ft_pret_@PEER2@;

CREATE TABLE ft_pret_@PEER1@ (
    id_pret INT,
    id_ouv INT NOT NULL,
    id_etud INT NOT NULL,
    date_emprunt DATETIME NOT NULL,
    date_retour DATETIME
) ENGINE=FEDERATED
CONNECTION='mysql://biblio:@PASSWORD@@HOST1@:3306/biblio/pret';

CREATE TABLE ft_pret_@PEER2@ (
    id_pret INT,
    id_ouv INT NOT NULL,
    id_etud INT NOT NULL,
    date_emprunt DATETIME NOT NULL,
    date_retour DATETIME
) ENGINE=FEDERATED
CONNECTION='mysql://biblio:@PASSWORD@@HOST2@:3306/biblio/pret';

-- ======================================================
-- EMPLOYES
-- ======================================================

DROP TABLE IF EXISTS ft_employe_@PEER1@;
DROP TABLE IF EXISTS ft_employe_@PEER2@;

CREATE TABLE ft_employe_@PEER1@ (
    id_emp INT,
    nom VARCHAR(120) NOT NULL,
    adresse VARCHAR(200),
    statut VARCHAR(60),
    bibliotheque VARCHAR(10) NOT NULL
) ENGINE=FEDERATED
CONNECTION='mysql://biblio:@PASSWORD@@HOST1@:3306/biblio/employe';

CREATE TABLE ft_employe_@PEER2@ (
    id_emp INT,
    nom VARCHAR(120) NOT NULL,
    adresse VARCHAR(200),
    statut VARCHAR(60),
    bibliotheque VARCHAR(10) NOT NULL
) ENGINE=FEDERATED
CONNECTION='mysql://biblio:@PASSWORD@@HOST2@:3306/biblio/employe';

-- ======================================================
-- AUTEURS
-- ======================================================

DROP TABLE IF EXISTS ft_auteur_@PEER1@;
DROP TABLE IF EXISTS ft_auteur_@PEER2@;

CREATE TABLE ft_auteur_@PEER1@ (
    id_aut INT,
    nom_auteur VARCHAR(120) NOT NULL
) ENGINE=FEDERATED
CONNECTION='mysql://biblio:@PASSWORD@@HOST1@:3306/biblio/auteur';

CREATE TABLE ft_auteur_@PEER2@ (
    id_aut INT,
    nom_auteur VARCHAR(120) NOT NULL
) ENGINE=FEDERATED
CONNECTION='mysql://biblio:@PASSWORD@@HOST2@:3306/biblio/auteur';

-- ======================================================
-- VUES GLOBALES
-- ======================================================

CREATE OR REPLACE VIEW auteur_global AS
SELECT * FROM auteur
UNION ALL
SELECT * FROM ft_auteur_@PEER1@
UNION ALL
SELECT * FROM ft_auteur_@PEER2@;

CREATE OR REPLACE VIEW employe_global AS
SELECT * FROM employe
UNION ALL
SELECT * FROM ft_employe_@PEER1@
UNION ALL
SELECT * FROM ft_employe_@PEER2@;

CREATE OR REPLACE VIEW etudiant_global AS
SELECT * FROM etudiant
UNION ALL
SELECT * FROM ft_etudiant_@PEER1@
UNION ALL
SELECT * FROM ft_etudiant_@PEER2@;

CREATE OR REPLACE VIEW ouvrage_global AS
SELECT * FROM ouvrage
UNION ALL
SELECT * FROM ft_ouvrage_@PEER1@
UNION ALL
SELECT * FROM ft_ouvrage_@PEER2@;

CREATE OR REPLACE VIEW pret_global AS
SELECT * FROM pret
UNION ALL
SELECT * FROM ft_pret_@PEER1@
UNION ALL
SELECT * FROM ft_pret_@PEER2@;