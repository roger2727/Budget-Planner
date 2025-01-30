import React from 'react';
import { View, Text, Dimensions } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { ExpenseSource } from '@/types/interfaces';

interface DonutChartProps {
  income: number;
  expenses: ExpenseSource[];
  savings: number;
  viewMode: 'weekly' | 'monthly' | 'annual';
}

const DonutChart: React.FC<DonutChartProps> = ({ income, expenses, savings, viewMode }) => {
  const windowWidth = Dimensions.get('window').width;
  const size = Math.min(windowWidth - 140, 220);
  const strokeWidth = 35;
  const center = size / 2;
  const radius = (size - strokeWidth) / 2;

  const convertAmount = (amount: number, frequency: string): number => {
    switch (viewMode) {
      case 'weekly':
        return amount / (frequency === 'weekly' ? 1 : 
          frequency === 'fortnightly' ? 2 : 
          frequency === 'monthly' ? 4 : 52);
      case 'monthly':
        return amount / (frequency === 'monthly' ? 1 : 
          frequency === 'fortnightly' ? 0.5 : 
          frequency === 'annually' ? 12 : 4);
      default: // annual
        return amount * (frequency === 'annually' ? 1 : 
          frequency === 'fortnightly' ? 26 : 
          frequency === 'monthly' ? 12 : 52);
    }
  };

  const categoryTotals = expenses.reduce((acc, expense) => {
    if (expense.amount > 0) {
      const convertedAmount = convertAmount(expense.amount, expense.frequency);
      acc[expense.category] = (acc[expense.category] || 0) + convertedAmount;
    }
    return acc;
  }, {} as Record<string, number>);
  
  const totalExpensesAndSavings = Object.values(categoryTotals).reduce((sum, amount) => sum + amount, 0);

  const colors: Record<string, string> = {
    'Housing': '#FF6B6B',
    'Insurance': '#4ECDC4',
    'Financial': '#45B7D1',
    'Food & Groceries': '#96CEB4',
    'Personal & Medical': '#FFEEAD',
    'Entertainment': '#D4A5A5',
    'Transport': '#FFB6C1',
    'Children': '#9FE2BF'
  };

  const getOffset = (index: number): number => {
    let offset = 0;
    for (let i = 0; i < index; i++) {
      offset -= (Object.values(categoryTotals)[i] / totalExpensesAndSavings) * 2 * Math.PI * radius;
    }
    return offset;
  };

  const nonZeroCategories = Object.entries(categoryTotals).filter(([_, amount]) => amount > 0);
  const balance = income - totalExpensesAndSavings - savings;

  return (
    <View style={styles.mainContainer}>
      <View style={styles.chartRow}>
        <Svg width={size} height={size}>
          <G transform={`rotate(-90 ${center} ${center})`}>
            {nonZeroCategories.map(([category, amount], index) => (
              <Circle
                key={category}
                cx={center}
                cy={center}
                r={radius}
                stroke={colors[category] || '#D4A5A5'}
                strokeWidth={strokeWidth}
                fill="none"
                strokeDasharray={`${amount / totalExpensesAndSavings * 2 * Math.PI * radius} ${2 * Math.PI * radius}`}
                strokeDashoffset={getOffset(index)}
              />
            ))}

            {savings > 0 && (
              <Circle
                cx={center}
                cy={center}
                r={radius}
                stroke="#2196F3"
                strokeWidth={strokeWidth}
                fill="none"
                strokeDasharray={`${savings / totalExpensesAndSavings * 2 * Math.PI * radius} ${2 * Math.PI * radius}`}
                strokeDashoffset={getOffset(nonZeroCategories.length)}
              />
            )}
          </G>
        </Svg>

        <View style={styles.totalsContainer}>
          <View style={styles.totalItem}>
            <Text style={styles.totalLabel}>Total Income</Text>
            <Text style={[styles.totalAmount, { color: '#4CAF50' }]}>
              ${income.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
          </View>
          <View style={styles.totalItem}>
            <Text style={styles.totalLabel}>Total Expenses</Text>
            <Text style={[styles.totalAmount, { color: '#f44336' }]}>
              ${totalExpensesAndSavings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
          </View>
          <View style={styles.totalItem}>
            <Text style={styles.totalLabel}>Total Savings</Text>
            <Text style={[styles.totalAmount, { color: '#2196F3' }]}>
              ${savings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
          </View>
          <View style={styles.totalItem}>
            <Text style={styles.totalLabel}>{balance >= 0 ? 'Surplus' : 'Deficit'}</Text>
            <Text style={[styles.totalAmount, { color: balance >= 0 ? '#4CAF50' : '#f44336' }]}>
              ${Math.abs(balance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.legendContainer}>
        {nonZeroCategories.map(([category, amount]) => (
          <View key={category} style={styles.legendItem}>
            <View style={[styles.colorBox, { backgroundColor: colors[category] || '#D4A5A5' }]} />
            <Text style={styles.legendText}>
              {category} (${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
            </Text>
          </View>
        ))}
        {savings > 0 && (
          <View style={styles.legendItem}>
            <View style={[styles.colorBox, { backgroundColor: '#2196F3' }]} />
            <Text style={styles.legendText}>
              Savings (${savings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = {
  mainContainer: {
    width: '100%' as const,
  },
  chartRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    marginBottom: 20,
  },
  totalsContainer: {
    marginLeft: 20,
  },
  totalItem: {
    marginBottom: 10,
  },
  totalLabel: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700' as const,
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: '700' as const,
  },
  legendContainer: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    justifyContent: 'center' as const,
    gap: 10,
  },
  legendItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  colorBox: {
    width: 12,
    height: 12,
    marginRight: 8,
    borderRadius: 2,
  },
  legendText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '400' as const,
  }
};

export default DonutChart;