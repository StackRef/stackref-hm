-- Database:    sr
-- Table:       judging_criterion
-- Description: Change criterion_value column name to criterion_weight (SR-215)

ALTER TABLE sr."judging_criterion"
RENAME COLUMN criterion_value TO criterion_weight;
