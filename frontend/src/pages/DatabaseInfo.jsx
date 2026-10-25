import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import Topbar from '../components/Topbar';
import { 
  Database, 
  Layers, 
  Key, 
  ShieldCheck, 
  GitFork, 
  FileCode, 
  CheckCircle2,
  TableProperties
} from 'lucide-react';

export default function DatabaseInfo() {
  const [schemaInfo, setSchemaInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInfo = async () => {
      try {
        setLoading(true);
        const data = await api.getSchemaInfo();
        setSchemaInfo(data);
      } catch {
        // fallback
      } finally {
        setLoading(false);
      }
    };
    fetchInfo();
  }, []);

  return (
    <>
      <Topbar title="Database Architecture & RDBMS Concepts" subtitle="Academic Relational Design, Normalization, Integrity Constraints & ACID Principles" />
      <div className="page-container">
        
        {/* Academic Overview Card */}
        <div className="card" style={{ borderLeft: '4px solid #2563eb' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.5rem' }}>
            <Database size={20} color="#2563eb" />
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>E-Commerce Relational Database Architecture (ecommerce_db)</h2>
          </div>
          <p style={{ color: '#475569', fontSize: '0.925rem', lineHeight: 1.6 }}>
            Designed for the <strong>RDBMS Laboratory at Manipal University Jaipur</strong>, this system demonstrates comprehensive relational database modeling using <strong>MySQL InnoDB Engine</strong>. It strictly adheres to <strong>Third Normal Form (3NF)</strong>, enforces entity and referential integrity via declared constraints, provides indexed query optimizations, compiles five administrative views, and safeguards financial integrity through multi-statement <strong>ACID Transactions</strong>.
          </p>
        </div>

        {/* Live MySQL Metadata from information_schema */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <TableProperties size={18} />
              <span>Live Schema Metadata (Queried from information_schema)</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
            <div>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem', color: '#1e293b' }}>
                Base Tables ({schemaInfo?.tables?.length || 11})
              </h4>
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Table Name</th>
                      <th>Approx. Rows</th>
                    </tr>
                  </thead>
                  <tbody>
                    {schemaInfo?.tables?.map((t) => (
                      <tr key={t.table_name}>
                        <td style={{ fontWeight: 600, fontFamily: 'monospace' }}>{t.table_name}</td>
                        <td>{t.approximate_rows}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem', color: '#1e293b' }}>
                Compiled Views ({schemaInfo?.views?.length || 5})
              </h4>
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>View Name</th>
                      <th>Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {schemaInfo?.views?.map((v) => (
                      <tr key={v.view_name}>
                        <td style={{ fontWeight: 600, fontFamily: 'monospace', color: '#2563eb' }}>{v.view_name}</td>
                        <td><span className="badge badge-info">Pre-compiled DQL</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Core RDBMS Academic Concepts Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
          
          {/* Normalization Card */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <Layers size={18} color="#2563eb" />
                <span>Database Normalization (1NF to 3NF)</span>
              </div>
            </div>
            <div style={{ fontSize: '0.875rem', color: '#334155', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <strong>1. First Normal Form (1NF):</strong>
                <p style={{ color: '#64748b', marginTop: '2px' }}>
                  All table attributes are atomic. No multi-valued items or repeating groups exist. Line items are decomposed into independent rows in <code>order_items</code>.
                </p>
              </div>
              <div>
                <strong>2. Second Normal Form (2NF):</strong>
                <p style={{ color: '#64748b', marginTop: '2px' }}>
                  In 1NF and every non-key column is fully functionally dependent on the entire primary key. In <code>order_items</code>, <code>unit_price</code> and <code>quantity</code> depend on <code>(order_id, product_id)</code>, while product descriptions remain exclusively in <code>products</code>.
                </p>
              </div>
              <div>
                <strong>3. Third Normal Form (3NF):</strong>
                <p style={{ color: '#64748b', marginTop: '2px' }}>
                  In 2NF and no transitive functional dependencies exist (X &rarr; Y &rarr; Z). Customer shipping addresses reside in <code>addresses</code>, preventing repetitive address text storage across duplicate orders.
                </p>
              </div>
            </div>
          </div>

          {/* Constraints & Keys Card */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <ShieldCheck size={18} color="#16a34a" />
                <span>Integrity Constraints Enforced</span>
              </div>
            </div>
            <div style={{ fontSize: '0.875rem', color: '#334155', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <div>
                <strong>PRIMARY KEY:</strong> Auto-incrementing surrogate keys ensuring unique entity identification across all 11 tables.
              </div>
              <div>
                <strong>FOREIGN KEY &amp; Referential Actions:</strong>
                <p style={{ color: '#64748b', marginTop: '2px' }}>
                  <code>ON DELETE RESTRICT</code> on <code>customers</code> &amp; <code>products</code> prevents accidental deletion of historical records. <code>ON DELETE CASCADE</code> cleanly purges subordinate line items when parent orders or carts are removed.
                </p>
              </div>
              <div>
                <strong>CHECK Constraints:</strong>
                <p style={{ color: '#64748b', marginTop: '2px' }}>
                  <code>chk_product_stock: stock_quantity &gt;= 0</code>, <code>chk_product_price: price &gt; 0</code>, <code>chk_order_status: order_status IN (...)</code>.
                </p>
              </div>
              <div>
                <strong>UNIQUE Constraints:</strong> SKU, email, phone, transaction references, tracking numbers, and composite unique pairs <code>(order_id, product_id)</code>.
              </div>
            </div>
          </div>

          {/* ACID Transactions Card */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <CheckCircle2 size={18} color="#9333ea" />
                <span>ACID Transaction Implementation</span>
              </div>
            </div>
            <div style={{ fontSize: '0.875rem', color: '#334155', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <div>
                <strong>Atomicity:</strong> Order placement encapsulates row locking, inventory checking, order insertion, item insertion, inventory decrement, and payment initialization into one atomic block. If any step fails, <code>ROLLBACK</code> is triggered.
              </div>
              <div>
                <strong>Consistency:</strong> The database transitions only from one valid state to another. Constraints guarantee stock never goes below zero and financial sums match.
              </div>
              <div>
                <strong>Isolation:</strong> Utilizes <code>SELECT ... FOR UPDATE</code> row-level exclusive locks during stock validation to prevent race conditions or double-ordering under concurrency.
              </div>
              <div>
                <strong>Durability:</strong> Once committed, transactional logs written to InnoDB redo logs survive power loss and system crashes.
              </div>
            </div>
          </div>

          {/* Indexes & Views Card */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <GitFork size={18} color="#d97706" />
                <span>Indexes &amp; Analytical Views</span>
              </div>
            </div>
            <div style={{ fontSize: '0.875rem', color: '#334155', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <div>
                <strong>B-Tree Indexes:</strong>
                <p style={{ color: '#64748b', marginTop: '2px' }}>
                  Constructed on foreign keys (<code>idx_orders_customer</code>), search predicates (<code>idx_products_category</code>, <code>idx_products_price</code>), status filters (<code>idx_orders_status</code>), and compound lookup keys (<code>idx_orders_cust_date</code>).
                </p>
              </div>
              <div>
                <strong>Relational Views:</strong>
                <p style={{ color: '#64748b', marginTop: '2px' }}>
                  Pre-compiled multi-table join and aggregation views: <code>vw_order_summary</code>, <code>vw_category_sales</code>, <code>vw_customer_spending</code>, <code>vw_low_stock_products</code>, and <code>vw_monthly_revenue</code> simplify administration and speed up dashboard analytics.
                </p>
              </div>
            </div>
          </div>

        </div>

      </div>
    </>
  );
}
