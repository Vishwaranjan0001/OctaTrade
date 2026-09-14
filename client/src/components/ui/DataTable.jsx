/**
 * DataTable — the tabular primitive used by orders, holdings, ledger and activity.
 *
 * Purpose : one semantic, accessible, responsive table. Real <table> markup
 *           with a caption and column scopes so screen readers can navigate it;
 *           wide tables scroll INSIDE their own container (never the page) and
 *           opt out of Lenis so touch scrolling stays native.
 * Input   : caption (required, may be visually hidden), columns
 *           [{ key, header, align, width, numeric, render, srOnlyHeader }],
 *           rows, rowKey, empty/loading/error slots, onRowClick.
 * Output  : a scroll-contained table, or the supplied state slot.
 */
export function DataTable({
  caption,
  columns,
  rows,
  rowKey = (row, index) => row?._id || row?.id || index,
  loading = false,
  loadingSlot = null,
  emptySlot = null,
  errorSlot = null,
  onRowClick,
  compact = false,
  minWidth = 720
}) {
  if (errorSlot) return errorSlot;
  if (loading && loadingSlot) return loadingSlot;
  if (!loading && (!rows || rows.length === 0) && emptySlot) return emptySlot;

  return (
    <div className="ot-table-wrap ot-scroll-x" data-lenis-prevent>
      <table
        className={`ot-table ${compact ? "is-compact" : ""}`.trim()}
        style={{ minWidth }}
      >
        <caption className="ot-sr">{caption}</caption>
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                style={{
                  textAlign: column.align || (column.numeric ? "right" : "left"),
                  width: column.width
                }}
              >
                <span className={column.srOnlyHeader ? "ot-sr" : "ot-label"}>
                  {column.header}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {(rows || []).map((row, index) => {
            const interactive = Boolean(onRowClick);
            return (
              <tr
                key={rowKey(row, index)}
                className={interactive ? "is-interactive" : ""}
                onClick={interactive ? () => onRowClick(row) : undefined}
                tabIndex={interactive ? 0 : undefined}
                onKeyDown={
                  interactive
                    ? (event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          onRowClick(row);
                        }
                      }
                    : undefined
                }
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    style={{
                      textAlign: column.align || (column.numeric ? "right" : "left")
                    }}
                    className={column.numeric ? "ot-num" : undefined}
                    data-label={typeof column.header === "string" ? column.header : undefined}
                  >
                    {column.render ? column.render(row, index) : row[column.key]}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
