-- Corrige triggers GeneXus com definer inexistente (rootexterno)
-- Executar uma vez: node scripts/run-fix-triggers.mjs

DROP TRIGGER IF EXISTS trnsnotaitens_before_delete;
DROP TRIGGER IF EXISTS trnsnotaitens_before_update;
DROP TRIGGER IF EXISTS trnsdistribuicaoitens_before_update;

DELIMITER $$

CREATE TRIGGER trnsnotaitens_before_update
BEFORE UPDATE ON trnsnotaitens
FOR EACH ROW
BEGIN
    SET NEW.notaItemQtdeAntes = OLD.notaItemQtde;
END$$

CREATE TRIGGER trnsdistribuicaoitens_before_update
BEFORE UPDATE ON trnsdistribuicaoitens
FOR EACH ROW
BEGIN
    SET NEW.distItemQtdeAntes = OLD.distItemQuantidade;
END$$

DELIMITER ;
