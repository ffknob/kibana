/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { AboutStepRule } from '../../types';

export const defaultValue: AboutStepRule = {
  name: '',
  description: '',
  isNew: true,
  severity: 'low',
  riskScore: 50,
  references: [''],
  falsePositives: [''],
  tags: [],
};
