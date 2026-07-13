-- ============================================================
-- DEMONSTRATION DES TRANSACTIONS XA
-- Projet : Bibliothèque Répartie
-- ============================================================

-- ============================================================
-- SCENARIO 1 : COMMIT
-- ============================================================

-- Démarrer une transaction XA
XA START 'demo-xa-001';

-- Exemple : ajout d'un auteur
INSERT INTO auteur(id_aut, nom_auteur)
VALUES (100, 'Auteur XA');

-- Fin des opérations
XA END 'demo-xa-001';

-- Préparation
XA PREPARE 'demo-xa-001';

-- Vérifier que la transaction est préparée
XA RECOVER;

-- Validation définitive
XA COMMIT 'demo-xa-001';

-- Vérification
SELECT *
FROM auteur
WHERE id_aut = 100;


-- ============================================================
-- SCENARIO 2 : ROLLBACK
-- ============================================================

XA START 'demo-xa-002';

INSERT INTO auteur(id_aut, nom_auteur)
VALUES (101, 'Auteur Rollback');

XA END 'demo-xa-002';

XA PREPARE 'demo-xa-002';

XA RECOVER;

XA ROLLBACK 'demo-xa-002';

-- Aucun résultat attendu
SELECT *
FROM auteur
WHERE id_aut = 101;


-- ============================================================
-- SCENARIO 3 : TRANSACTION EN ATTENTE
-- ============================================================

XA START 'demo-xa-003';

INSERT INTO auteur(id_aut, nom_auteur)
VALUES (102, 'Auteur En Attente');

XA END 'demo-xa-003';

XA PREPARE 'demo-xa-003';

-- La transaction reste préparée
XA RECOVER;

-- Pour terminer plus tard :
-- XA COMMIT 'demo-xa-003';
-- ou
-- XA ROLLBACK 'demo-xa-003';