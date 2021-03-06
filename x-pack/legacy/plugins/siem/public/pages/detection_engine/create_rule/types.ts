/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { FieldValueQueryBar } from './components/query_bar';
import { esFilters } from '../../../../../../../../src/plugins/data/common';

export enum RuleStep {
  defineRule = 'define-rule',
  aboutRule = 'about-rule',
  scheduleRule = 'schedule-rule',
}
export type RuleStatusType = 'passive' | 'active' | 'valid';

export interface RuleStepData {
  data: unknown;
  isValid: boolean;
}

export interface RuleStepProps {
  setStepData: (step: RuleStep, data: unknown, isValid: boolean) => void;
  isEditView: boolean;
  isLoading: boolean;
}

interface StepRuleData {
  isNew: boolean;
}
export interface AboutStepRule extends StepRuleData {
  name: string;
  description: string;
  severity: string;
  riskScore: number;
  references: string[];
  falsePositives: string[];
  tags: string[];
}

export interface DefineStepRule extends StepRuleData {
  outputIndex: string;
  useIndicesConfig: string;
  index: string[];
  queryBar: FieldValueQueryBar;
}

export interface ScheduleStepRule extends StepRuleData {
  enabled: boolean;
  interval: string;
  from: string;
  to?: string;
}

export interface DefineStepRuleJson {
  output_index: string;
  index: string[];
  filters: esFilters.Filter[];
  saved_id?: string;
  query: string;
  language: string;
}

export interface AboutStepRuleJson {
  name: string;
  description: string;
  severity: string;
  risk_score: number;
  references: string[];
  false_positives: string[];
  tags: string[];
}

export type ScheduleStepRuleJson = ScheduleStepRule;

export type FormatRuleType = 'query' | 'saved_query';
