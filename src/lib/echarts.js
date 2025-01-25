import * as charts from 'echarts';

export function echarts(node, option) {
    const chart = charts.init(node);
    chart.setOption(option);
}