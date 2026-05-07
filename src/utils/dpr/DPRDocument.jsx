import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import { fmtFull, fmtCompact, fmtPct } from './dprData';

// All-Helvetica typography keeps the PDF embedded-font-free so it ships
// in ~30KB instead of ~300KB. Bankers don't read DPRs for typography —
// they read for accuracy.
const COLORS = {
  fg1: '#1a1a1a',
  fg2: '#444',
  fg3: '#888',
  border: '#d0d0d0',
  accent: '#5a7244',     // Sage from the app theme
  accentBg: '#f0eee2',
  red: '#c0392b',
  green: '#2a7d3c',
  amber: '#b06000',
};

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: COLORS.fg1,
    paddingTop: 40,
    paddingBottom: 50,
    paddingHorizontal: 36,
  },
  // Cover page
  coverPage: {
    fontFamily: 'Helvetica',
    paddingTop: 0,
    paddingBottom: 0,
    paddingHorizontal: 0,
    color: COLORS.fg1,
  },
  coverHero: {
    backgroundColor: COLORS.accentBg,
    padding: 48,
    borderBottomWidth: 4,
    borderBottomColor: COLORS.accent,
    borderBottomStyle: 'solid',
  },
  coverEyebrow: {
    fontSize: 9,
    letterSpacing: 2,
    color: COLORS.accent,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 14,
  },
  coverTitle: {
    fontSize: 32,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.fg1,
    marginBottom: 6,
  },
  coverSubtitle: {
    fontSize: 13,
    color: COLORS.fg2,
    marginBottom: 24,
    lineHeight: 1.4,
  },
  coverMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 0,
  },
  coverMetaItem: {
    width: '50%',
    paddingTop: 10,
    paddingRight: 16,
  },
  coverMetaLabel: {
    fontSize: 8,
    letterSpacing: 1,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.fg3,
    marginBottom: 3,
  },
  coverMetaValue: {
    fontSize: 11,
    color: COLORS.fg1,
  },
  coverVerdict: {
    padding: 32,
    paddingTop: 36,
  },
  coverVerdictHeadline: {
    fontSize: 22,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.accent,
    marginBottom: 8,
  },
  coverVerdictHeadlineNeg: {
    color: COLORS.red,
  },
  coverVerdictDetail: {
    fontSize: 11,
    color: COLORS.fg2,
    lineHeight: 1.55,
  },
  // Body page
  pageHeader: {
    position: 'absolute',
    top: 18,
    left: 36,
    right: 36,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 8,
    color: COLORS.fg3,
  },
  pageFooter: {
    position: 'absolute',
    bottom: 24,
    left: 36,
    right: 36,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 8,
    color: COLORS.fg3,
    borderTopWidth: 0.5,
    borderTopColor: COLORS.border,
    paddingTop: 6,
  },
  // Section
  section: {
    marginBottom: 18,
  },
  sectionEyebrow: {
    fontSize: 8,
    letterSpacing: 1.5,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.fg3,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.fg1,
    marginBottom: 4,
  },
  sectionLead: {
    fontSize: 9,
    color: COLORS.fg2,
    lineHeight: 1.5,
    marginBottom: 12,
  },
  // KPI grid (executive summary)
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
    marginBottom: 14,
  },
  kpiTile: {
    width: '33.333%',
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  kpiTileInner: {
    borderWidth: 0.5,
    borderColor: COLORS.border,
    borderStyle: 'solid',
    borderRadius: 4,
    padding: 8,
  },
  kpiLabel: {
    fontSize: 7,
    letterSpacing: 1,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.fg3,
    marginBottom: 3,
  },
  kpiValue: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.fg1,
    marginBottom: 2,
  },
  kpiSub: {
    fontSize: 8,
    color: COLORS.fg3,
  },
  // Verdict callout (executive summary)
  verdictCallout: {
    backgroundColor: COLORS.accentBg,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.accent,
    borderLeftStyle: 'solid',
    padding: 12,
    marginBottom: 16,
  },
  verdictHeadline: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.accent,
    marginBottom: 4,
  },
  verdictHeadlineNeg: {
    color: COLORS.red,
  },
  verdictDetail: {
    fontSize: 9,
    color: COLORS.fg2,
    lineHeight: 1.5,
  },
  // Tables
  table: {
    borderTopWidth: 0.5,
    borderColor: COLORS.border,
    borderStyle: 'solid',
    marginBottom: 12,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f0',
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
    borderBottomStyle: 'solid',
    paddingVertical: 5,
  },
  tableHeaderCell: {
    fontSize: 7.5,
    letterSpacing: 0.6,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.fg3,
    paddingHorizontal: 6,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.25,
    borderBottomColor: COLORS.border,
    borderBottomStyle: 'solid',
    paddingVertical: 4,
  },
  tableRowSubtotal: {
    backgroundColor: '#fafaf3',
    paddingVertical: 5,
  },
  tableCell: {
    fontSize: 9,
    paddingHorizontal: 6,
  },
  tableCellRight: {
    textAlign: 'right',
  },
  tableCellBold: {
    fontFamily: 'Helvetica-Bold',
  },
  // Heading inside section (sub-section title)
  subHeading: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.fg1,
    marginTop: 8,
    marginBottom: 6,
  },
  // Plain row pair (for finance sheet)
  pairRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 0.25,
    borderBottomColor: COLORS.border,
    borderBottomStyle: 'solid',
  },
  pairLabel: {
    fontSize: 9,
    color: COLORS.fg2,
  },
  pairValue: {
    fontSize: 9,
    color: COLORS.fg1,
    fontFamily: 'Helvetica-Bold',
  },
});

function PageHeader({ projectName, generatedAt }) {
  return (
    <View style={styles.pageHeader} fixed>
      <Text>{projectName}</Text>
      <Text>Detailed Project Report · {generatedAt.toLocaleDateString()}</Text>
    </View>
  );
}

function PageFooter({ projectName }) {
  return (
    <View style={styles.pageFooter} fixed>
      <Text>{projectName}</Text>
      <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
    </View>
  );
}

function CoverPage({ cover, summary }) {
  const verdictNeg = !summary.verdict.positive;
  return (
    <Page size="A4" style={styles.coverPage}>
      <View style={styles.coverHero}>
        <Text style={styles.coverEyebrow}>DETAILED PROJECT REPORT</Text>
        <Text style={styles.coverTitle}>{cover.projectName}</Text>
        {cover.projectCategory ? (
          <Text style={styles.coverSubtitle}>{cover.projectCategory}</Text>
        ) : null}

        <View style={styles.coverMeta}>
          {cover.promoterName ? (
            <View style={styles.coverMetaItem}>
              <Text style={styles.coverMetaLabel}>PROMOTER</Text>
              <Text style={styles.coverMetaValue}>{cover.promoterName}</Text>
            </View>
          ) : null}
          {cover.location ? (
            <View style={styles.coverMetaItem}>
              <Text style={styles.coverMetaLabel}>LOCATION</Text>
              <Text style={styles.coverMetaValue}>{cover.location}</Text>
            </View>
          ) : null}
          <View style={styles.coverMetaItem}>
            <Text style={styles.coverMetaLabel}>GENERATED</Text>
            <Text style={styles.coverMetaValue}>{cover.generatedAt.toLocaleString()}</Text>
          </View>
        </View>
      </View>

      <View style={styles.coverVerdict}>
        <Text style={[styles.coverVerdictHeadline, verdictNeg && styles.coverVerdictHeadlineNeg]}>
          {summary.verdict.headline}
        </Text>
        <Text style={styles.coverVerdictDetail}>{summary.verdict.detail}</Text>
      </View>
    </Page>
  );
}

function ExecutiveSummary({ summary }) {
  const verdictNeg = !summary.verdict.positive;
  return (
    <View style={styles.section}>
      <Text style={styles.sectionEyebrow}>SECTION 1</Text>
      <Text style={styles.sectionTitle}>Executive Summary</Text>
      <Text style={styles.sectionLead}>
        Headline metrics for the project at the long-run capacity ceiling. Year-1 figures (and the per-year ramp) follow in the P&amp;L Statement and Projection sections.
      </Text>

      <View style={styles.verdictCallout}>
        <Text style={[styles.verdictHeadline, verdictNeg && styles.verdictHeadlineNeg]}>
          {summary.verdict.headline}
        </Text>
        <Text style={styles.verdictDetail}>{summary.verdict.detail}</Text>
      </View>

      <View style={styles.kpiGrid}>
        {summary.headline.map((k, i) => (
          <View key={i} style={styles.kpiTile}>
            <View style={styles.kpiTileInner}>
              <Text style={styles.kpiLabel}>{k.label.toUpperCase()}</Text>
              <Text style={styles.kpiValue}>{k.value}</Text>
              <Text style={styles.kpiSub}>{k.sub}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

function ProjectConfiguration({ products, variableCosts, fixedCosts, capexRows, totalCapex, subsidies, inputSnapshot }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionEyebrow}>SECTION 2</Text>
      <Text style={styles.sectionTitle}>Project Configuration</Text>
      <Text style={styles.sectionLead}>
        Plant build-out: products and pricing, operating costs, capex breakdown, and the subsidy stack applied to the gross capex.
      </Text>

      {/* Products */}
      {products.length > 0 ? (
        <>
          <Text style={styles.subHeading}>Products &amp; Pricing</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, { flex: 2.2 }]}>PRODUCT</Text>
              <Text style={[styles.tableHeaderCell, { flex: 0.7 }]}>UNIT</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'right' }]}>PRICE</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'right' }]}>QTY/YR</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1.2, textAlign: 'right' }]}>ANNUAL</Text>
            </View>
            {products.map((p, i) => (
              <View key={i} style={styles.tableRow}>
                <Text style={[styles.tableCell, { flex: 2.2 }]}>{p.name}</Text>
                <Text style={[styles.tableCell, { flex: 0.7 }]}>{p.unit}</Text>
                <Text style={[styles.tableCell, styles.tableCellRight, { flex: 1 }]}>{fmtFull(p.price)}</Text>
                <Text style={[styles.tableCell, styles.tableCellRight, { flex: 1 }]}>{p.qty.toLocaleString('en-IN')}</Text>
                <Text style={[styles.tableCell, styles.tableCellRight, styles.tableCellBold, { flex: 1.2 }]}>{fmtCompact(p.annualValue)}</Text>
              </View>
            ))}
          </View>
        </>
      ) : null}

      {/* Variable costs */}
      {variableCosts.length > 0 ? (
        <>
          <Text style={styles.subHeading}>Variable Costs</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, { flex: 2.2 }]}>ITEM</Text>
              <Text style={[styles.tableHeaderCell, { flex: 0.7 }]}>UNIT</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'right' }]}>COST</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'right' }]}>QTY/YR</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1.2, textAlign: 'right' }]}>ANNUAL</Text>
            </View>
            {variableCosts.map((v, i) => (
              <View key={i} style={styles.tableRow}>
                <Text style={[styles.tableCell, { flex: 2.2 }]}>{v.name}</Text>
                <Text style={[styles.tableCell, { flex: 0.7 }]}>{v.unit}</Text>
                <Text style={[styles.tableCell, styles.tableCellRight, { flex: 1 }]}>{fmtFull(v.price)}</Text>
                <Text style={[styles.tableCell, styles.tableCellRight, { flex: 1 }]}>{v.qty.toLocaleString('en-IN')}</Text>
                <Text style={[styles.tableCell, styles.tableCellRight, styles.tableCellBold, { flex: 1.2 }]}>{fmtCompact(v.annualValue)}</Text>
              </View>
            ))}
          </View>
        </>
      ) : null}

      {/* Fixed costs */}
      {fixedCosts.length > 0 ? (
        <>
          <Text style={styles.subHeading}>Fixed Costs</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, { flex: 4 }]}>ITEM</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1.5, textAlign: 'right' }]}>ANNUAL</Text>
            </View>
            {fixedCosts.map((f, i) => (
              <View key={i} style={styles.tableRow}>
                <Text style={[styles.tableCell, { flex: 4 }]}>{f.name}</Text>
                <Text style={[styles.tableCell, styles.tableCellRight, styles.tableCellBold, { flex: 1.5 }]}>{fmtCompact(f.annualValue)}</Text>
              </View>
            ))}
          </View>
        </>
      ) : null}

      {/* Capex breakdown */}
      <Text style={styles.subHeading}>Capital Cost</Text>
      {capexRows.length > 0 ? (
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, { flex: 4 }]}>CATEGORY</Text>
            <Text style={[styles.tableHeaderCell, { flex: 1.5, textAlign: 'right' }]}>AMOUNT</Text>
            <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'right' }]}>%</Text>
          </View>
          {capexRows.map((c, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={[styles.tableCell, { flex: 4 }]}>{c.name}</Text>
              <Text style={[styles.tableCell, styles.tableCellRight, { flex: 1.5 }]}>{fmtCompact(c.amount)}</Text>
              <Text style={[styles.tableCell, styles.tableCellRight, { flex: 1 }]}>{((c.amount / totalCapex) * 100).toFixed(0)}%</Text>
            </View>
          ))}
          <View style={[styles.tableRow, styles.tableRowSubtotal]}>
            <Text style={[styles.tableCell, styles.tableCellBold, { flex: 4 }]}>Total Capital Cost</Text>
            <Text style={[styles.tableCell, styles.tableCellRight, styles.tableCellBold, { flex: 1.5 }]}>{fmtCompact(totalCapex)}</Text>
            <Text style={[styles.tableCell, styles.tableCellRight, styles.tableCellBold, { flex: 1 }]}>100%</Text>
          </View>
        </View>
      ) : (
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableRowSubtotal]}>
            <Text style={[styles.tableCell, styles.tableCellBold, { flex: 4 }]}>Total Capital Cost</Text>
            <Text style={[styles.tableCell, styles.tableCellRight, styles.tableCellBold, { flex: 1.5 }]}>{fmtCompact(totalCapex)}</Text>
          </View>
        </View>
      )}

      {/* Subsidies */}
      {subsidies.length > 0 ? (
        <>
          <Text style={styles.subHeading}>Subsidy Stack</Text>
          <View style={styles.table}>
            {subsidies.map((s, i) => (
              <View key={i} style={styles.tableRow}>
                <Text style={[styles.tableCell, { flex: 5 }]}>{s.scheme}</Text>
                <Text style={[styles.tableCell, styles.tableCellRight, { flex: 1, color: COLORS.green }]}>Applied</Text>
              </View>
            ))}
          </View>
        </>
      ) : null}
    </View>
  );
}

function MeansOfFinance({ finance }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionEyebrow}>SECTION 3</Text>
      <Text style={styles.sectionTitle}>Means of Finance</Text>
      <Text style={styles.sectionLead}>
        Capital structure after subsidies. Equity is the promoter's contribution; debt is the term loan to be raised on this DPR.
      </Text>

      <View>
        <View style={styles.pairRow}>
          <Text style={styles.pairLabel}>Gross Capital Cost</Text>
          <Text style={styles.pairValue}>{fmtCompact(finance.grossCapex)}</Text>
        </View>
        {finance.subsidySaved > 0 ? (
          <View style={styles.pairRow}>
            <Text style={[styles.pairLabel, { color: COLORS.accent }]}>Less: Subsidies</Text>
            <Text style={[styles.pairValue, { color: COLORS.accent }]}>− {fmtCompact(finance.subsidySaved)}</Text>
          </View>
        ) : null}
        <View style={[styles.pairRow, { backgroundColor: '#fafaf3', paddingVertical: 6 }]}>
          <Text style={[styles.pairLabel, { fontFamily: 'Helvetica-Bold', color: COLORS.fg1 }]}>Effective CAPEX</Text>
          <Text style={styles.pairValue}>{fmtCompact(finance.effectiveCapex)}</Text>
        </View>
        <View style={styles.pairRow}>
          <Text style={styles.pairLabel}>Promoter Equity ({finance.equityPct}%)</Text>
          <Text style={styles.pairValue}>{fmtCompact(finance.equity)}</Text>
        </View>
        <View style={styles.pairRow}>
          <Text style={styles.pairLabel}>Term Loan ({finance.debtPct}% @ {fmtPct(finance.interestRate)} for {finance.tenure} yrs)</Text>
          <Text style={styles.pairValue}>{fmtCompact(finance.loan)}</Text>
        </View>
        {finance.workingCapital > 0 ? (
          <View style={styles.pairRow}>
            <Text style={styles.pairLabel}>Working Capital ({finance.receivableDays}R + {finance.inventoryDays}I − {finance.payableDays}P d)</Text>
            <Text style={styles.pairValue}>{fmtCompact(finance.workingCapital)}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

function PLStatementSection({ plStatement }) {
  // wrap is left ON (default): the line list grows with the user's
  // fixedRows count, so projects with many fixed-cost categories can
  // legitimately exceed a single page. Letting the section wrap means
  // it'll spill onto the next page cleanly instead of clipping.
  return (
    <View style={styles.section}>
      <Text style={styles.sectionEyebrow}>SECTION 4</Text>
      <Text style={styles.sectionTitle}>Year-1 P&amp;L Statement</Text>
      <Text style={styles.sectionLead}>
        Year-1 deductions chain: Revenue → Variable → Fixed → EBITDA → Depreciation → Interest → PBT → Tax → PAT.
        Detail column documents the formula source for each line.
      </Text>

      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderCell, { flex: 2.2 }]}>LINE ITEM</Text>
          <Text style={[styles.tableHeaderCell, { flex: 3 }]}>DETAIL</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1.6, textAlign: 'right' }]}>AMOUNT</Text>
        </View>
        {plStatement.map((line, i) => {
          const colour =
            line.amount > 0 && (line.label === 'Revenue' || line.positive) ? COLORS.green :
            line.amount < 0 ? COLORS.red :
            line.subtotal && line.amount < 0 ? COLORS.red :
            line.subtotal && line.amount > 0 ? COLORS.green :
            COLORS.fg1;
          return (
            <View key={i} style={[styles.tableRow, line.subtotal && styles.tableRowSubtotal]}>
              <Text style={[
                styles.tableCell,
                { flex: 2.2, paddingLeft: line.indent ? 16 : 6 },
                line.subtotal && styles.tableCellBold,
              ]}>
                {line.label}
              </Text>
              <Text style={[styles.tableCell, { flex: 3, color: COLORS.fg3, fontSize: 8 }]}>
                {line.detail}
              </Text>
              <Text style={[
                styles.tableCell,
                styles.tableCellRight,
                { flex: 1.6, color: colour },
                line.subtotal && styles.tableCellBold,
              ]}>
                {fmtCompact(line.amount)}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function ProjectionSection({ projection }) {
  if (!projection || projection.length === 0) return null;
  return (
    <View style={styles.section} break>
      <Text style={styles.sectionEyebrow}>SECTION 5</Text>
      <Text style={styles.sectionTitle}>{projection.length}-Year Projection</Text>
      <Text style={styles.sectionLead}>
        Year-by-year cash-flow projection. Capacity ramps from Y1 toward the ceiling; revenue and costs scale by the configured inflation rates.
      </Text>

      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderCell, { flex: 0.4 }]}>YR</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1.2, textAlign: 'right' }]}>REVENUE</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'right' }]}>VAR</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'right' }]}>FIXED</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'right' }]}>EBITDA</Text>
          <Text style={[styles.tableHeaderCell, { flex: 0.9, textAlign: 'right' }]}>DEPR</Text>
          <Text style={[styles.tableHeaderCell, { flex: 0.9, textAlign: 'right' }]}>INT</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'right' }]}>PAT</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'right' }]}>NCF</Text>
          <Text style={[styles.tableHeaderCell, { flex: 0.6, textAlign: 'right' }]}>DSCR</Text>
        </View>
        {projection.map((r) => {
          const dscr = r.dscr === null || r.dscr === undefined ? '—' : r.dscr.toFixed(2);
          const dscrColour = r.dscr === null ? COLORS.fg3 : r.dscr >= 1.25 ? COLORS.green : r.dscr >= 1.0 ? COLORS.amber : COLORS.red;
          return (
            <View key={r.t} style={styles.tableRow}>
              <Text style={[styles.tableCell, { flex: 0.4, fontFamily: 'Helvetica-Bold' }]}>{r.t}</Text>
              <Text style={[styles.tableCell, styles.tableCellRight, { flex: 1.2 }]}>{fmtCompact(r.revenue)}</Text>
              <Text style={[styles.tableCell, styles.tableCellRight, { flex: 1, color: COLORS.fg3 }]}>{fmtCompact(r.variableCosts)}</Text>
              <Text style={[styles.tableCell, styles.tableCellRight, { flex: 1, color: COLORS.fg3 }]}>{fmtCompact(r.fixedCosts)}</Text>
              <Text style={[styles.tableCell, styles.tableCellRight, styles.tableCellBold, { flex: 1, color: r.ebitda >= 0 ? COLORS.fg1 : COLORS.red }]}>{fmtCompact(r.ebitda)}</Text>
              <Text style={[styles.tableCell, styles.tableCellRight, { flex: 0.9, color: COLORS.fg3 }]}>{fmtCompact(r.depreciation)}</Text>
              <Text style={[styles.tableCell, styles.tableCellRight, { flex: 0.9, color: COLORS.fg3 }]}>{fmtCompact(r.interest)}</Text>
              <Text style={[styles.tableCell, styles.tableCellRight, { flex: 1, color: r.pat >= 0 ? COLORS.fg1 : COLORS.red }]}>{fmtCompact(r.pat)}</Text>
              <Text style={[styles.tableCell, styles.tableCellRight, styles.tableCellBold, { flex: 1, color: r.ncf >= 0 ? COLORS.green : COLORS.red }]}>{fmtCompact(r.ncf)}</Text>
              <Text style={[styles.tableCell, styles.tableCellRight, styles.tableCellBold, { flex: 0.6, color: dscrColour }]}>{dscr}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function LoanScheduleSection({ loanSchedule, loanTotals }) {
  if (!loanSchedule || loanSchedule.length === 0) return null;
  const showSubvention = loanTotals.totalSubvention > 0;
  // wrap is left ON (default): tenure can be up to 20 years, which
  // doesn't fit on a single page once the section header + totals row
  // are accounted for. Wrapping lets the table flow across pages.
  return (
    <View style={styles.section}>
      <Text style={styles.sectionEyebrow}>SECTION 6</Text>
      <Text style={styles.sectionTitle}>Loan Amortisation Schedule</Text>
      <Text style={styles.sectionLead}>
        Year-by-year debt service split into principal + interest, with outstanding balance falling toward zero by the end of tenure.
      </Text>

      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderCell, { flex: 0.5 }]}>YR</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1.5, textAlign: 'right' }]}>PRINCIPAL</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1.5, textAlign: 'right' }]}>INTEREST</Text>
          {showSubvention ? <Text style={[styles.tableHeaderCell, { flex: 1.5, textAlign: 'right' }]}>SUBVENTION</Text> : null}
          <Text style={[styles.tableHeaderCell, { flex: 1.5, textAlign: 'right' }]}>BALANCE</Text>
        </View>
        {loanSchedule.map((r) => (
          <View key={r.year} style={styles.tableRow}>
            <Text style={[styles.tableCell, { flex: 0.5, fontFamily: 'Helvetica-Bold' }]}>{r.year}</Text>
            <Text style={[styles.tableCell, styles.tableCellRight, { flex: 1.5 }]}>{fmtCompact(r.principal)}</Text>
            <Text style={[styles.tableCell, styles.tableCellRight, { flex: 1.5, color: COLORS.red }]}>{fmtCompact(r.interest)}</Text>
            {showSubvention ? (
              <Text style={[styles.tableCell, styles.tableCellRight, { flex: 1.5, color: r.subvention > 0 ? COLORS.green : COLORS.fg3 }]}>
                {r.subvention > 0 ? fmtCompact(r.subvention) : '—'}
              </Text>
            ) : null}
            <Text style={[styles.tableCell, styles.tableCellRight, { flex: 1.5, color: COLORS.fg3 }]}>{fmtCompact(r.loanBalance)}</Text>
          </View>
        ))}
        <View style={[styles.tableRow, styles.tableRowSubtotal]}>
          <Text style={[styles.tableCell, styles.tableCellBold, { flex: 0.5 }]}>Σ</Text>
          <Text style={[styles.tableCell, styles.tableCellRight, styles.tableCellBold, { flex: 1.5 }]}>{fmtCompact(loanTotals.totalPrincipal)}</Text>
          <Text style={[styles.tableCell, styles.tableCellRight, styles.tableCellBold, { flex: 1.5, color: COLORS.red }]}>{fmtCompact(loanTotals.totalInterest)}</Text>
          {showSubvention ? (
            <Text style={[styles.tableCell, styles.tableCellRight, styles.tableCellBold, { flex: 1.5, color: COLORS.green }]}>{fmtCompact(loanTotals.totalSubvention)}</Text>
          ) : null}
          <Text style={[styles.tableCell, { flex: 1.5 }]}> </Text>
        </View>
      </View>
    </View>
  );
}

function ReturnsAnalysis({ returns }) {
  return (
    <View style={styles.section} wrap={false}>
      <Text style={styles.sectionEyebrow}>SECTION 7</Text>
      <Text style={styles.sectionTitle}>Returns Analysis</Text>
      <Text style={styles.sectionLead}>
        The metrics a banker / investor will read first. IRR &gt; hurdle, NPV &gt; 0, payback &lt; tenure, and DSCR &gt;= 1.25 together establish bankability.
      </Text>

      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderCell, { flex: 2 }]}>METRIC</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1.4, textAlign: 'right' }]}>VALUE</Text>
          <Text style={[styles.tableHeaderCell, { flex: 2.5 }]}>BENCHMARK</Text>
        </View>
        {returns.map((r, i) => (
          <View key={i} style={styles.tableRow}>
            <Text style={[styles.tableCell, { flex: 2 }]}>{r.label}</Text>
            <Text style={[styles.tableCell, styles.tableCellRight, styles.tableCellBold, { flex: 1.4 }]}>{r.value}</Text>
            <Text style={[styles.tableCell, { flex: 2.5, color: COLORS.fg3 }]}>{r.threshold}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function SensitivitySection({ sensitivity }) {
  if (!sensitivity || sensitivity.length === 0) return null;
  return (
    <View style={styles.section} wrap={false}>
      <Text style={styles.sectionEyebrow}>SECTION 8</Text>
      <Text style={styles.sectionTitle}>Sensitivity Analysis</Text>
      <Text style={styles.sectionLead}>
        Each driver flexed ±20% one at a time. EBITDA delta in rupees, sorted by impact. Top entries are where contract negotiation, hedging, or tighter assumptions earn the most.
      </Text>

      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderCell, { flex: 0.5 }]}>RANK</Text>
          <Text style={[styles.tableHeaderCell, { flex: 2.2 }]}>DRIVER</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1.4, textAlign: 'right' }]}>−20% Δ EBITDA</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1.4, textAlign: 'right' }]}>+20% Δ EBITDA</Text>
          <Text style={[styles.tableHeaderCell, { flex: 0.9, textAlign: 'right' }]}>SWING</Text>
        </View>
        {sensitivity.map((s, i) => {
          const lowColour  = s.deltaLow  < 0 ? COLORS.red : COLORS.green;
          const highColour = s.deltaHigh > 0 ? COLORS.green : COLORS.red;
          const lowSign    = s.deltaLow  > 0 ? '+' : (s.deltaLow  < 0 ? '−' : '');
          const highSign   = s.deltaHigh > 0 ? '+' : (s.deltaHigh < 0 ? '−' : '');
          return (
            <View key={i} style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.tableCellBold, { flex: 0.5 }]}>#{s.rank}</Text>
              <Text style={[styles.tableCell, { flex: 2.2 }]}>{s.driver}</Text>
              <Text style={[styles.tableCell, styles.tableCellRight, { flex: 1.4, color: lowColour }]}>
                {lowSign}{fmtCompact(Math.abs(s.deltaLow))}
              </Text>
              <Text style={[styles.tableCell, styles.tableCellRight, { flex: 1.4, color: highColour }]}>
                {highSign}{fmtCompact(Math.abs(s.deltaHigh))}
              </Text>
              <Text style={[styles.tableCell, styles.tableCellRight, styles.tableCellBold, { flex: 0.9 }]}>±{s.swingPct.toFixed(0)}%</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function AssumptionsAppendix({ inputSnapshot }) {
  return (
    <View style={styles.section} break>
      <Text style={styles.sectionEyebrow}>APPENDIX A</Text>
      <Text style={styles.sectionTitle}>Standing Assumptions</Text>
      <Text style={styles.sectionLead}>
        Behind-the-scenes inputs every projection in this DPR uses. Recorded here so reviewers can interrogate the model.
      </Text>

      <View>
        <View style={styles.pairRow}>
          <Text style={styles.pairLabel}>Capacity ceiling (long-run)</Text>
          <Text style={styles.pairValue}>{fmtPct(inputSnapshot.capacityCeilingPct, 0)}</Text>
        </View>
        <View style={styles.pairRow}>
          <Text style={styles.pairLabel}>Capacity Y1</Text>
          <Text style={styles.pairValue}>{fmtPct(inputSnapshot.capacityY1Pct, 0)}</Text>
        </View>
        <View style={styles.pairRow}>
          <Text style={styles.pairLabel}>Capacity ramp / yr</Text>
          <Text style={styles.pairValue}>{inputSnapshot.capacityRampPct} pp / yr</Text>
        </View>
        <View style={styles.pairRow}>
          <Text style={styles.pairLabel}>Project lifetime</Text>
          <Text style={styles.pairValue}>{inputSnapshot.lifetime} years</Text>
        </View>
        <View style={styles.pairRow}>
          <Text style={styles.pairLabel}>Revenue inflation</Text>
          <Text style={styles.pairValue}>{fmtPct(inputSnapshot.revenueInflationPct)} per year</Text>
        </View>
        <View style={styles.pairRow}>
          <Text style={styles.pairLabel}>Cost inflation</Text>
          <Text style={styles.pairValue}>{fmtPct(inputSnapshot.costInflationPct)} per year</Text>
        </View>
        <View style={styles.pairRow}>
          <Text style={styles.pairLabel}>Tax rate</Text>
          <Text style={styles.pairValue}>{fmtPct(inputSnapshot.taxRate)} effective</Text>
        </View>
        <View style={styles.pairRow}>
          <Text style={styles.pairLabel}>Interest subvention</Text>
          <Text style={styles.pairValue}>
            {inputSnapshot.interestSubventionPct > 0
              ? `${fmtPct(inputSnapshot.interestSubventionPct)} × ${inputSnapshot.interestSubventionYears} yrs`
              : '—'}
          </Text>
        </View>
        <View style={styles.pairRow}>
          <Text style={styles.pairLabel}>Depreciation method</Text>
          <Text style={styles.pairValue}>15% WDV (Indian P&amp;M block rate)</Text>
        </View>
        <View style={styles.pairRow}>
          <Text style={styles.pairLabel}>Loan amortisation</Text>
          <Text style={styles.pairValue}>Straight-line principal</Text>
        </View>
      </View>
    </View>
  );
}

export default function DPRDocument({ data }) {
  return (
    <Document
      title={`${data.cover.projectName} — DPR`}
      author={data.cover.promoterName || 'venture-log'}
      subject="Detailed Project Report">
      <CoverPage cover={data.cover} summary={data.summary} />
      <Page size="A4" style={styles.page}>
        <PageHeader projectName={data.cover.projectName} generatedAt={data.cover.generatedAt} />
        <PageFooter projectName={data.cover.projectName} />

        <ExecutiveSummary summary={data.summary} />
        <ProjectConfiguration
          products={data.products}
          variableCosts={data.variableCosts}
          fixedCosts={data.fixedCosts}
          capexRows={data.capexRows}
          totalCapex={data.totalCapex}
          subsidies={data.subsidies}
          inputSnapshot={data.inputSnapshot}
        />
        <MeansOfFinance finance={data.finance} />
        <PLStatementSection plStatement={data.plStatement} />
        <ProjectionSection projection={data.projection} />
        <LoanScheduleSection loanSchedule={data.loanSchedule} loanTotals={data.loanTotals} />
        <ReturnsAnalysis returns={data.returns} />
        <SensitivitySection sensitivity={data.sensitivity} />
        <AssumptionsAppendix inputSnapshot={data.inputSnapshot} />
      </Page>
    </Document>
  );
}
