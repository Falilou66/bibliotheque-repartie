-- =====================================================
-- Modèle de schéma SQL
-- Le marqueur UADB sera remplacé par UGB, UCAD ou UADB
-- =====================================================

DROP TABLE IF EXISTS pret;
DROP TABLE IF EXISTS ouvrage;
DROP TABLE IF EXISTS etudiant;
DROP TABLE IF EXISTS employe;
DROP TABLE IF EXISTS auteur;

-- =====================================================
-- TABLE AUTEUR (répliquée)
-- =====================================================

CREATE TABLE auteur (
    id_aut INT AUTO_INCREMENT PRIMARY KEY,
    nom_auteur VARCHAR(120) NOT NULL
) ENGINE=InnoDB;

-- =====================================================
-- TABLE EMPLOYE
-- =====================================================

CREATE TABLE employe (
    id_emp INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(120) NOT NULL,
    adresse VARCHAR(200),
    statut VARCHAR(60),
    bibliotheque VARCHAR(10) NOT NULL,

    -- Authentification des employés (locale au site).
    -- Mot de passe en clair : projet BDR (démo), pas de contrainte de sécurité.
    login VARCHAR(60),
    mot_de_passe VARCHAR(120),

    CONSTRAINT chk_emp_site
        CHECK (bibliotheque = 'UADB'),
    CONSTRAINT uq_emp_login UNIQUE (login)
) ENGINE=InnoDB;

-- =====================================================
-- TABLE ETUDIANT
-- =====================================================

CREATE TABLE etudiant (
    id_etud INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(120) NOT NULL,
    adresse VARCHAR(200),
    universite VARCHAR(10) NOT NULL,
    specialite VARCHAR(80),
    nbre_emprunts INT NOT NULL DEFAULT 0,

    CONSTRAINT chk_etu_site
        CHECK (universite = 'UADB'),

    CONSTRAINT chk_limite
        CHECK (nbre_emprunts BETWEEN 0 AND 5)
) ENGINE=InnoDB;

-- =====================================================
-- TABLE OUVRAGE
-- =====================================================

CREATE TABLE ouvrage (
    id_ouv INT AUTO_INCREMENT PRIMARY KEY,
    titre VARCHAR(200) NOT NULL,
    id_auteur INT NOT NULL,
    editeur VARCHAR(120),
    annee INT,
    domaine VARCHAR(60),
    stock INT NOT NULL DEFAULT 0,
    site VARCHAR(10) NOT NULL,

    CONSTRAINT fk_ouvrage_auteur
        FOREIGN KEY (id_auteur)
        REFERENCES auteur(id_aut),

    CONSTRAINT chk_ouvrage_site
        CHECK (site = 'UADB'),

    CONSTRAINT chk_stock
        CHECK (stock >= 0),

    INDEX idx_ouvrage_domaine (domaine),
    INDEX idx_ouvrage_site (site)
) ENGINE=InnoDB;

-- =====================================================
-- TABLE PRET
-- =====================================================

CREATE TABLE pret (
    id_pret INT AUTO_INCREMENT PRIMARY KEY,
    id_ouv INT NOT NULL,
    id_etud INT NOT NULL,

    date_emprunt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    date_retour DATETIME NULL,

    CONSTRAINT fk_pret_ouvrage
        FOREIGN KEY (id_ouv)
        REFERENCES ouvrage(id_ouv),

    INDEX idx_pret_etudiant (id_etud),
    INDEX idx_pret_ouvrage (id_ouv)
) ENGINE=InnoDB;