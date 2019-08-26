/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import React from 'react';
import { termsOperation } from './terms';
import { shallow } from 'enzyme';
import { IndexPatternPrivateState, TermsIndexPatternColumn } from '../indexpattern';
import { EuiRange, EuiSelect } from '@elastic/eui';
import { UiSettingsClientContract } from 'src/core/public';
import { Storage } from 'ui/storage';
import { createMockedIndexPattern } from '../mocks';

jest.mock('ui/new_platform');

describe('terms', () => {
  let state: IndexPatternPrivateState;
  const InlineOptions = termsOperation.paramEditor!;

  beforeEach(() => {
    state = {
      indexPatterns: {},
      currentIndexPatternId: '1',
      layers: {
        first: {
          indexPatternId: '1',
          columnOrder: ['col1', 'col2'],
          columns: {
            col1: {
              label: 'Top value of category',
              dataType: 'string',
              isBucketed: true,
              isMetric: false,

              // Private
              operationType: 'terms',
              params: {
                orderBy: { type: 'alphabetical' },
                size: 3,
                orderDirection: 'asc',
              },
              sourceField: 'category',
            },
            col2: {
              label: 'Count',
              dataType: 'number',
              isBucketed: false,
              isMetric: true,

              // Private
              operationType: 'count',
            },
          },
        },
      },
    };
  });

  describe('toEsAggsConfig', () => {
    it('should reflect params correctly', () => {
      const esAggsConfig = termsOperation.toEsAggsConfig(
        state.layers.first.columns.col1 as TermsIndexPatternColumn,
        'col1'
      );
      expect(esAggsConfig).toEqual(
        expect.objectContaining({
          params: expect.objectContaining({
            orderBy: '_key',
            field: 'category',
            size: 3,
          }),
        })
      );
    });
  });

  describe('onFieldChange', () => {
    it('should change correctly to new field', () => {
      const oldColumn: TermsIndexPatternColumn = {
        operationType: 'terms',
        sourceField: 'source',
        label: 'Top values of source',
        isBucketed: true,
        dataType: 'string',
        isMetric: false,
        params: {
          size: 5,
          orderBy: {
            type: 'alphabetical',
          },
          orderDirection: 'asc',
        },
      };
      const indexPattern = createMockedIndexPattern();
      const newDateField = indexPattern.fields.find(i => i.name === 'dest')!;

      const column = termsOperation.onFieldChange(oldColumn, indexPattern, newDateField);
      expect(column).toHaveProperty('sourceField', 'dest');
      expect(column).toHaveProperty('params.size', 5);
      expect(column).toHaveProperty('params.orderBy.type', 'alphabetical');
      expect(column).toHaveProperty('params.orderDirection', 'asc');
      expect(column.label).toContain('dest');
    });
  });

  describe('getPossibleOperationsForField', () => {
    it('should return operation with the right type', () => {
      expect(
        termsOperation.getPossibleOperationsForField({
          aggregatable: true,
          searchable: true,
          name: 'test',
          type: 'string',
          aggregationRestrictions: {
            terms: {
              agg: 'terms',
            },
          },
        })
      ).toEqual([
        {
          dataType: 'string',
          isBucketed: true,
          isMetric: false,
          scale: 'ordinal',
        },
      ]);

      expect(
        termsOperation.getPossibleOperationsForField({
          aggregatable: true,
          searchable: true,
          name: 'test',
          type: 'boolean',
        })
      ).toEqual([
        {
          dataType: 'boolean',
          isBucketed: true,
          isMetric: false,
          scale: 'ordinal',
        },
      ]);
    });

    it('should not return an operation if restrictions prevent terms', () => {
      expect(
        termsOperation.getPossibleOperationsForField({
          aggregatable: false,
          searchable: true,
          name: 'test',
          type: 'string',
        })
      ).toEqual([]);

      expect(
        termsOperation.getPossibleOperationsForField({
          aggregatable: true,
          aggregationRestrictions: {},
          searchable: true,
          name: 'test',
          type: 'string',
        })
      ).toEqual([]);
    });
  });

  describe('buildColumn', () => {
    it('should use type from the passed field', () => {
      const termsColumn = termsOperation.buildColumn({
        layerId: 'first',
        suggestedPriority: undefined,
        indexPattern: createMockedIndexPattern(),
        field: {
          aggregatable: true,
          searchable: true,
          type: 'boolean',
          name: 'test',
        },
        columns: {},
      });
      expect(termsColumn.dataType).toEqual('boolean');
    });

    it('should use existing metric column as order column', () => {
      const termsColumn = termsOperation.buildColumn({
        layerId: 'first',
        suggestedPriority: undefined,
        indexPattern: createMockedIndexPattern(),
        columns: {
          col1: {
            label: 'Count',
            dataType: 'number',
            isBucketed: false,
            isMetric: true,

            // Private
            operationType: 'count',
          },
        },
        field: {
          aggregatable: true,
          searchable: true,
          type: 'boolean',
          name: 'test',
        },
      });
      expect(termsColumn.params).toEqual(
        expect.objectContaining({
          orderBy: { type: 'column', columnId: 'col1' },
        })
      );
    });
  });

  describe('onOtherColumnChanged', () => {
    it('should keep the column if order by column still exists and is metric', () => {
      const initialColumn: TermsIndexPatternColumn = {
        label: 'Top value of category',
        dataType: 'string',
        isBucketed: true,
        isMetric: false,

        // Private
        operationType: 'terms',
        params: {
          orderBy: { type: 'column', columnId: 'col1' },
          size: 3,
          orderDirection: 'asc',
        },
        sourceField: 'category',
      };
      const updatedColumn = termsOperation.onOtherColumnChanged!(initialColumn, {
        col1: {
          label: 'Count',
          dataType: 'number',
          isBucketed: false,
          isMetric: true,

          // Private
          operationType: 'count',
        },
      });
      expect(updatedColumn).toBe(initialColumn);
    });

    it('should switch to alphabetical ordering if the order column is removed', () => {
      const termsColumn = termsOperation.onOtherColumnChanged!(
        {
          label: 'Top value of category',
          dataType: 'string',
          isBucketed: true,
          isMetric: false,

          // Private
          operationType: 'terms',
          params: {
            orderBy: { type: 'column', columnId: 'col1' },
            size: 3,
            orderDirection: 'asc',
          },
          sourceField: 'category',
        },
        {}
      );
      expect(termsColumn.params).toEqual(
        expect.objectContaining({
          orderBy: { type: 'alphabetical' },
        })
      );
    });

    it('should switch to alphabetical ordering if the order column is not a metric anymore', () => {
      const termsColumn = termsOperation.onOtherColumnChanged!(
        {
          label: 'Top value of category',
          dataType: 'string',
          isBucketed: true,
          isMetric: false,

          // Private
          operationType: 'terms',
          params: {
            orderBy: { type: 'column', columnId: 'col1' },
            size: 3,
            orderDirection: 'asc',
          },
          sourceField: 'category',
        },
        {
          col1: {
            label: 'Value of timestamp',
            dataType: 'date',
            isBucketed: true,
            isMetric: false,

            // Private
            operationType: 'date_histogram',
            params: {
              interval: 'w',
            },
            sourceField: 'timestamp',
          },
        }
      );
      expect(termsColumn.params).toEqual(
        expect.objectContaining({
          orderBy: { type: 'alphabetical' },
        })
      );
    });
  });

  describe('popover param editor', () => {
    it('should render current order by value and options', () => {
      const setStateSpy = jest.fn();
      const instance = shallow(
        <InlineOptions
          state={state}
          setState={setStateSpy}
          columnId="col1"
          layerId="first"
          storage={{} as Storage}
          uiSettings={{} as UiSettingsClientContract}
        />
      );

      const select = instance.find('[data-test-subj="indexPattern-terms-orderBy"]').find(EuiSelect);

      expect(select.prop('value')).toEqual('alphabetical');

      expect(select.prop('options').map(({ value }) => value)).toEqual([
        'column$$$col2',
        'alphabetical',
      ]);
    });

    it('should not show filter ratio column as sort target', () => {
      const setStateSpy = jest.fn();
      const instance = shallow(
        <InlineOptions
          state={{
            ...state,
            layers: {
              first: {
                ...state.layers.first,
                columns: {
                  ...state.layers.first.columns,
                  col2: {
                    label: 'Count',
                    dataType: 'number',
                    isBucketed: false,
                    isMetric: true,

                    // Private
                    operationType: 'filter_ratio',
                    params: {
                      numerator: { query: '', language: 'kuery' },
                      denominator: { query: '', language: 'kuery' },
                    },
                  },
                },
              },
            },
          }}
          setState={setStateSpy}
          columnId="col1"
          layerId="first"
          storage={{} as Storage}
          uiSettings={{} as UiSettingsClientContract}
        />
      );

      const select = instance.find('[data-test-subj="indexPattern-terms-orderBy"]').find(EuiSelect);

      expect(select.prop('options').map(({ value }) => value)).toEqual(['alphabetical']);
    });

    it('should update state with the order by value', () => {
      const setStateSpy = jest.fn();
      const instance = shallow(
        <InlineOptions
          state={state}
          setState={setStateSpy}
          columnId="col1"
          layerId="first"
          storage={{} as Storage}
          uiSettings={{} as UiSettingsClientContract}
        />
      );

      instance
        .find(EuiSelect)
        .find('[data-test-subj="indexPattern-terms-orderBy"]')
        .prop('onChange')!({
        target: {
          value: 'column$$$col2',
        },
      } as React.ChangeEvent<HTMLSelectElement>);

      expect(setStateSpy).toHaveBeenCalledWith({
        ...state,
        layers: {
          first: {
            ...state.layers.first,
            columns: {
              ...state.layers.first.columns,
              col1: {
                ...state.layers.first.columns.col1,
                params: {
                  ...(state.layers.first.columns.col1 as TermsIndexPatternColumn).params,
                  orderBy: {
                    type: 'column',
                    columnId: 'col2',
                  },
                },
              },
            },
          },
        },
      });
    });

    it('should render current order direction value and options', () => {
      const setStateSpy = jest.fn();
      const instance = shallow(
        <InlineOptions
          state={state}
          setState={setStateSpy}
          columnId="col1"
          layerId="first"
          storage={{} as Storage}
          uiSettings={{} as UiSettingsClientContract}
        />
      );

      const select = instance
        .find('[data-test-subj="indexPattern-terms-orderDirection"]')
        .find(EuiSelect);

      expect(select.prop('value')).toEqual('asc');
      expect(select.prop('options').map(({ value }) => value)).toEqual(['asc', 'desc']);
    });

    it('should update state with the order direction value', () => {
      const setStateSpy = jest.fn();
      const instance = shallow(
        <InlineOptions
          state={state}
          setState={setStateSpy}
          columnId="col1"
          layerId="first"
          storage={{} as Storage}
          uiSettings={{} as UiSettingsClientContract}
        />
      );

      instance
        .find('[data-test-subj="indexPattern-terms-orderDirection"]')
        .find(EuiSelect)
        .prop('onChange')!({
        target: {
          value: 'desc',
        },
      } as React.ChangeEvent<HTMLSelectElement>);

      expect(setStateSpy).toHaveBeenCalledWith({
        ...state,
        layers: {
          first: {
            ...state.layers.first,
            columns: {
              ...state.layers.first.columns,
              col1: {
                ...state.layers.first.columns.col1,
                params: {
                  ...(state.layers.first.columns.col1 as TermsIndexPatternColumn).params,
                  orderDirection: 'desc',
                },
              },
            },
          },
        },
      });
    });

    it('should render current size value', () => {
      const setStateSpy = jest.fn();
      const instance = shallow(
        <InlineOptions
          state={state}
          setState={setStateSpy}
          columnId="col1"
          layerId="first"
          storage={{} as Storage}
          uiSettings={{} as UiSettingsClientContract}
        />
      );

      expect(instance.find(EuiRange).prop('value')).toEqual(3);
    });

    it('should update state with the size value', () => {
      const setStateSpy = jest.fn();
      const instance = shallow(
        <InlineOptions
          state={state}
          setState={setStateSpy}
          columnId="col1"
          layerId="first"
          storage={{} as Storage}
          uiSettings={{} as UiSettingsClientContract}
        />
      );

      instance.find(EuiRange).prop('onChange')!({
        target: {
          value: '7',
        },
      } as React.ChangeEvent<HTMLInputElement>);
      expect(setStateSpy).toHaveBeenCalledWith({
        ...state,
        layers: {
          first: {
            ...state.layers.first,
            columns: {
              ...state.layers.first.columns,
              col1: {
                ...state.layers.first.columns.col1,
                params: {
                  ...(state.layers.first.columns.col1 as TermsIndexPatternColumn).params,
                  size: 7,
                },
              },
            },
          },
        },
      });
    });
  });
});