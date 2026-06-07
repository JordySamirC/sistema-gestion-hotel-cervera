import { Injectable } from '@angular/core';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { PagoResponse } from '../models/pago';
import { GastoResponse } from '../models/gasto';

export interface ItemExcelReport {
  descripcion: string;
  cantidad: number;
  precioUnitarioSinIgv: number;
  montoNeto: number;
  igv: number;
  total: number;
}

@Injectable({ providedIn: 'root' })
export class ExcelReportService {

  async generarExcelContador(pago: PagoResponse, items: ItemExcelReport[]): Promise<void> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Reporte para Contador');

    // 1. Definición de las 18 columnas solicitadas
    worksheet.columns = [
      { header: 'Tipo Comprobante', key: 'tipoComp', width: 18 },
      { header: 'Serie', key: 'serie', width: 10 },
      { header: 'Número', key: 'numero', width: 10 },
      { header: 'Fecha Emisión', key: 'fecha', width: 15 },
      { header: 'RUC Emisor', key: 'rucEmisor', width: 15 },
      { header: 'Razón Social Emisor', key: 'rsEmisor', width: 35 },
      { header: 'Tipo Doc. Cliente', key: 'tipoDocCli', width: 18 },
      { header: 'N° Doc. Cliente', key: 'numDocCli', width: 15 },
      { header: 'Razón Social / Nombre', key: 'rsCli', width: 35 },
      { header: 'Descripción', key: 'desc', width: 30 },
      { header: 'Cantidad (noches)', key: 'cant', width: 15 },
      { header: 'Precio Unit. (sin IGV)', key: 'puSinIgv', width: 18 },
      { header: 'Monto Neto', key: 'neto', width: 15 },
      { header: 'IGV (18%)', key: 'igv', width: 15 },
      { header: 'Total', key: 'total', width: 15 },
      { header: 'Método de Pago', key: 'metodo', width: 18 },
      { header: 'Referencia Pago', key: 'ref', width: 20 },
      { header: 'Observaciones', key: 'obs', width: 30 }
    ];

    // 2. Estilo para la cabecera (Azul Premium)
    const headerRow = worksheet.getRow(1);
    headerRow.height = 25;
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1F4E78' }
      };
      cell.font = {
        color: { argb: 'FFFFFFFF' },
        bold: true,
        size: 11
      };
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });

    // 3. Formatear fecha
    const fechaFormat = pago.fechaPago ? new Date(pago.fechaPago).toLocaleDateString('es-PE') : '---';

    // 4. Determinar datos del cliente
    const tipoDocCli = pago.tipoComprobante === 'FACTURA' ? 'RUC' : (pago.clienteTipoDocumento || 'DNI');
    const numDocCli = pago.tipoComprobante === 'FACTURA' ? pago.clienteRuc : pago.clienteDocumento;
    const rsCli = pago.tipoComprobante === 'FACTURA' ? pago.clienteRazonSocial : pago.clienteNombre;

    // 5. Añadir items
    items.forEach((item) => {
      const row = worksheet.addRow({
        tipoComp: pago.tipoComprobante,
        serie: pago.serie,
        numero: pago.numero,
        fecha: fechaFormat,
        rucEmisor: pago.emisorRuc,
        rsEmisor: pago.emisorRazonSocial,
        tipoDocCli: tipoDocCli,
        numDocCli: numDocCli,
        rsCli: rsCli,
        desc: item.descripcion,
        cant: item.cantidad,
        puSinIgv: item.precioUnitarioSinIgv,
        neto: item.montoNeto,
        igv: item.igv,
        total: item.total,
        metodo: pago.metodoPago,
        ref: pago.referenciaPago || 'N/A',
        obs: pago.observaciones || 'N/A'
      });

      // Formatos numéricos
      ['puSinIgv', 'neto', 'igv', 'total'].forEach(col => {
        row.getCell(col).numFmt = '#,##0.00';
      });

      // Bordes y alineación
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
        cell.alignment = { vertical: 'middle' };
      });
    });

    // 6. Generar nombre de archivo estándar (tipo Oracle Opera)
    const fechaCompacta = pago.fechaPago ? new Date(pago.fechaPago).toISOString().split('T')[0].replace(/-/g, '') : '00000000';
    const numeroPadded = String(pago.numero).padStart(4, '0');
    const fileName = `${pago.tipoComprobante}_${pago.serie}_${numeroPadded}_${fechaCompacta}.xlsx`;

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, fileName);
  }

  // Método legacy para no romper ReservaDetail por ahora (aunque lo actualizaremos)
  async exportarReservaAFacturacion(reserva: any, pago: PagoResponse): Promise<void> {
    // Adaptamos los datos de la reserva al nuevo formato
    const items: ItemExcelReport[] = reserva.detalles.map((d: any) => {
      const totalItem = pago.montoTotal / (reserva.detalles.length || 1);
      const netoItem = totalItem / 1.18;
      const igvItem = totalItem - netoItem;
      const noches = 1; // Simplificado si no tenemos acceso a la estadía aquí

      return {
        descripcion: `Hospedaje - Hab. ${d.habitacionNumero}`,
        cantidad: noches,
        precioUnitarioSinIgv: netoItem / noches,
        montoNeto: netoItem,
        igv: igvItem,
        total: totalItem
      };
    });

    return this.generarExcelContador(pago, items);
  }

  async generarExcelConsolidado(pagos: PagoResponse[]): Promise<void> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Historial de Pagos');

    // 1. Columnas (Mismas 18 columnas para consistencia)
    worksheet.columns = [
      { header: 'Tipo Comprobante', key: 'tipoComp', width: 18 },
      { header: 'Serie', key: 'serie', width: 10 },
      { header: 'Número', key: 'numero', width: 10 },
      { header: 'Fecha Emisión', key: 'fecha', width: 15 },
      { header: 'RUC Emisor', key: 'rucEmisor', width: 15 },
      { header: 'Razón Social Emisor', key: 'rsEmisor', width: 35 },
      { header: 'Tipo Doc. Cliente', key: 'tipoDocCli', width: 18 },
      { header: 'N° Doc. Cliente', key: 'numDocCli', width: 15 },
      { header: 'Razón Social / Nombre', key: 'rsCli', width: 35 },
      { header: 'Descripción / Hab.', key: 'desc', width: 30 },
      { header: 'Cantidad', key: 'cant', width: 10 },
      { header: 'Monto Neto', key: 'neto', width: 15 },
      { header: 'IGV (18%)', key: 'igv', width: 15 },
      { header: 'Total', key: 'total', width: 15 },
      { header: 'Método de Pago', key: 'metodo', width: 18 },
      { header: 'Referencia Pago', key: 'ref', width: 20 },
      { header: 'Observaciones', key: 'obs', width: 30 }
    ];

    // 2. Estilo Cabecera
    const headerRow = worksheet.getRow(1);
    headerRow.eachCell(cell => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F4E78' } };
      cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });

    // 3. Añadir filas de pagos
    pagos.forEach(p => {
      const row = worksheet.addRow({
        tipoComp: p.tipoComprobante,
        serie: p.serie,
        numero: p.numero,
        fecha: p.fechaPago ? new Date(p.fechaPago).toLocaleDateString('es-PE') : '---',
        rucEmisor: p.emisorRuc,
        rsEmisor: p.emisorRazonSocial,
        tipoDocCli: p.clienteTipoDocumento || (p.clienteRuc ? 'RUC' : 'DNI'),
        numDocCli: p.clienteDocumento || p.clienteRuc,
        rsCli: p.clienteNombre || p.clienteRazonSocial,
        desc: p.descripcionHabitaciones || 'Hospedaje',
        cant: p.cantidadHabitaciones || 1,
        neto: p.montoNeto,
        igv: p.igv,
        total: p.montoTotal,
        metodo: p.metodoPago,
        ref: p.referenciaPago || '---',
        obs: p.observaciones || '---'
      });

      // Formatos
      ['neto', 'igv', 'total'].forEach(col => {
        row.getCell(col).numFmt = '#,##0.00';
      });
    });

    // 4. Descargar
    const fileName = `REPORTE_PAGOS_${new Date().toISOString().split('T')[0].replace(/-/g, '')}.xlsx`;
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, fileName);
  }

  async generarExcelGastos(gastos: GastoResponse[]): Promise<void> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Reporte de Gastos');

    // 1. Definición de Columnas
    worksheet.columns = [
      { header: 'Fecha', key: 'fecha', width: 15 },
      { header: 'Categoría', key: 'categoria', width: 20 },
      { header: 'Tipo de Gasto', key: 'tipo', width: 15 },
      { header: 'Descripción', key: 'descripcion', width: 35 },
      { header: 'Monto (S/)', key: 'monto', width: 15 },
      { header: 'Registrado por', key: 'creador', width: 25 },
      { header: 'Estado', key: 'estado', width: 15 },
      { header: 'Observaciones', key: 'observaciones', width: 30 }
    ];

    // 2. Estilo Cabecera (Verde Esmeralda Premium para Gastos)
    const headerRow = worksheet.getRow(1);
    headerRow.height = 25;
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF2C5E43' }
      };
      cell.font = {
        color: { argb: 'FFFFFFFF' },
        bold: true,
        size: 11
      };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });

    // 3. Añadir Filas
    gastos.forEach((g) => {
      const row = worksheet.addRow({
        fecha: g.fechaGasto ? new Date(g.fechaGasto).toLocaleDateString('es-PE') : '---',
        categoria: g.categoriaNombre,
        tipo: g.tipoGastoNombre,
        descripcion: g.descripcion,
        monto: g.monto,
        creador: g.creadoPorNombre,
        estado: g.estado,
        observaciones: g.observaciones || '---'
      });

      // Formato de Monto
      row.getCell('monto').numFmt = '#,##0.00';

      // Colores especiales de estado
      const estadoCell = row.getCell('estado');
      if (g.estado === 'ANULADO') {
        estadoCell.font = { color: { argb: 'FFC00000' }, bold: true };
      } else {
        estadoCell.font = { color: { argb: 'FF008000' }, bold: true };
      }

      // Bordes y alineación
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
        cell.alignment = { vertical: 'middle' };
      });
    });

    // 4. Descargar
    const fileName = `REPORTE_GASTOS_${new Date().toISOString().split('T')[0].replace(/-/g, '')}.xlsx`;
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, fileName);
  }

  async generarExcelReportesCompleto(reporteCompleto: any, desde: string, hasta: string): Promise<void> {
    const workbook = new ExcelJS.Workbook();

    // ==========================================
    // 1. HOJA DE RESUMEN EJECUTIVO
    // ==========================================
    const wsResumen = workbook.addWorksheet('Resumen Ejecutivo');
    wsResumen.views = [{ showGridLines: true }];

    // Título y Período
    wsResumen.mergeCells('A1:E1');
    const titleCell = wsResumen.getCell('A1');
    titleCell.value = 'HOTEL CERVERA - REPORTE EJECUTIVO COMPLETO';
    titleCell.font = { name: 'Calibri', size: 16, bold: true, color: { argb: 'FF1F4E78' } };
    titleCell.alignment = { vertical: 'middle', horizontal: 'left' };
    wsResumen.getRow(1).height = 30;

    wsResumen.mergeCells('A2:E2');
    const subCell = wsResumen.getCell('A2');
    subCell.value = `Período seleccionado: ${desde} al ${hasta}`;
    subCell.font = { name: 'Calibri', size: 11, italic: true, color: { argb: 'FF555555' } };
    subCell.alignment = { vertical: 'middle', horizontal: 'left' };
    wsResumen.getRow(2).height = 20;

    // Fila en blanco
    wsResumen.addRow([]);

    // Cabecera KPIs
    const kpiHeader = wsResumen.addRow(['Métrica KPI', 'Valor Período Actual', 'Valor Período Previo', 'Diferencia / Variación', 'Tendencia']);
    kpiHeader.height = 25;
    kpiHeader.eachCell(cell => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F4E78' } };
      cell.font = { color: { argb: 'FFFFFFFF' }, bold: true, size: 11 };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    });

    const kpisData = [
      { kpi: 'Ocupación', act: (reporteCompleto.kpis.ocupacion.valorActual / 100), prev: (reporteCompleto.kpis.ocupacion.valorAnterior / 100), diff: (reporteCompleto.kpis.ocupacion.porcentajeCambio / 100), fmt: '0.00%', tend: reporteCompleto.kpis.ocupacion.tendencia },
      { kpi: 'Tarifa Promedio Diaria', act: reporteCompleto.kpis.adr.valorActual, prev: reporteCompleto.kpis.adr.valorAnterior, diff: (reporteCompleto.kpis.adr.porcentajeCambio / 100), fmt: 'S/ #,##0.00', fmtDiff: '0.00%', tend: reporteCompleto.kpis.adr.tendencia },
      { kpi: 'Ingreso por Habitación Disponible', act: reporteCompleto.kpis.revPar.valorActual, prev: reporteCompleto.kpis.revPar.valorAnterior, diff: (reporteCompleto.kpis.revPar.porcentajeCambio / 100), fmt: 'S/ #,##0.00', fmtDiff: '0.00%', tend: reporteCompleto.kpis.revPar.tendencia },
      { kpi: 'Ingreso Total por Habitación', act: reporteCompleto.kpis.trevPar.valorActual, prev: reporteCompleto.kpis.trevPar.valorAnterior, diff: (reporteCompleto.kpis.trevPar.porcentajeCambio / 100), fmt: 'S/ #,##0.00', fmtDiff: '0.00%', tend: reporteCompleto.kpis.trevPar.tendencia },
      { kpi: 'Estadía Promedio (Noches)', act: reporteCompleto.kpis.alos.valorActual, prev: reporteCompleto.kpis.alos.valorAnterior, diff: (reporteCompleto.kpis.alos.porcentajeCambio / 100), fmt: '#,##0.00', fmtDiff: '0.00%', tend: reporteCompleto.kpis.alos.tendencia },
      { kpi: 'Tasa de Cancelaciones', act: (reporteCompleto.kpis.tasaCancelacion.valorActual / 100), prev: (reporteCompleto.kpis.tasaCancelacion.valorAnterior / 100), diff: (reporteCompleto.kpis.tasaCancelacion.porcentajeCambio / 100), fmt: '0.00%', tend: reporteCompleto.kpis.tasaCancelacion.tendencia }
    ];

    kpisData.forEach(kd => {
      const row = wsResumen.addRow([
        kd.kpi,
        kd.act,
        kd.prev,
        kd.diff,
        kd.tend === 'up' ? '▲ Incremento' : (kd.tend === 'down' ? '▼ Descenso' : '■ Estable')
      ]);
      row.height = 20;

      // Formato numérico
      row.getCell(2).numFmt = kd.fmt;
      row.getCell(3).numFmt = kd.fmt;
      row.getCell(4).numFmt = kd.fmtDiff || kd.fmt;

      // Estilos y bordes
      row.eachCell((cell, colIndex) => {
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
        cell.alignment = { vertical: 'middle' };
        if (colIndex === 1) cell.font = { bold: true };
        if (colIndex >= 2 && colIndex <= 4) cell.alignment = { vertical: 'middle', horizontal: 'right' };
        if (colIndex === 5) {
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
          if (kd.tend === 'up') cell.font = { color: { argb: 'FF006100' }, bold: true };
          else if (kd.tend === 'down') cell.font = { color: { argb: 'FF9C0006' }, bold: true };
        }
      });
    });

    wsResumen.addRow([]); // Espacio

    // Sección Financiera
    const finHeader = wsResumen.addRow(['Métricas Financieras', 'Período Actual (S/)', 'Período Previo (S/)', 'Diferencia Absoluta (S/)', '% Variación']);
    finHeader.height = 25;
    finHeader.eachCell(cell => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2C5E43' } }; // Verde premium
      cell.font = { color: { argb: 'FFFFFFFF' }, bold: true, size: 11 };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    });

    const totalIng = reporteCompleto.kpis.totalIngresos;
    const totalIngPrev = reporteCompleto.kpis.totalIngresosAnterior;
    const diffIng = totalIng - totalIngPrev;
    const varIng = totalIngPrev > 0 ? (diffIng / totalIngPrev) : 0;

    const totalGas = reporteCompleto.kpis.totalGastos;
    const totalGasPrev = reporteCompleto.kpis.totalGastosAnterior;
    const diffGas = totalGas - totalGasPrev;
    const varGas = totalGasPrev > 0 ? (diffGas / totalGasPrev) : 0;

    const neta = reporteCompleto.kpis.gananciaNeta;
    const netaPrev = reporteCompleto.kpis.gananciaNetaAnterior;
    const diffNet = neta - netaPrev;
    const varNet = netaPrev > 0 ? (diffNet / netaPrev) : 0;

    const finData = [
      { name: 'Ingresos por Reservas', act: totalIng, prev: totalIngPrev, diff: diffIng, var: varIng },
      { name: 'Gastos Registrados', act: totalGas, prev: totalGasPrev, diff: diffGas, var: varGas },
      { name: 'Ganancia Neta (Ingresos - Gastos)', act: neta, prev: netaPrev, diff: diffNet, var: varNet }
    ];

    finData.forEach(fd => {
      const row = wsResumen.addRow([
        fd.name,
        fd.act,
        fd.prev,
        fd.diff,
        fd.var
      ]);
      row.height = 22;

      // Formato numérico
      row.getCell(2).numFmt = 'S/ #,##0.00';
      row.getCell(3).numFmt = 'S/ #,##0.00';
      row.getCell(4).numFmt = 'S/ #,##0.00';
      row.getCell(5).numFmt = '0.00%';

      row.eachCell((cell, colIndex) => {
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
        cell.alignment = { vertical: 'middle' };
        if (colIndex === 1) cell.font = { bold: true };
        if (colIndex >= 2 && colIndex <= 4) cell.alignment = { vertical: 'middle', horizontal: 'right' };
        if (colIndex === 5) {
          cell.alignment = { vertical: 'middle', horizontal: 'right' };
          if (fd.var > 0) cell.font = { color: { argb: 'FF006100' }, bold: true };
          else if (fd.var < 0) cell.font = { color: { argb: 'FF9C0006' }, bold: true };
        }
      });
    });

    // Ajustar anchos
    wsResumen.getColumn(1).width = 35;
    wsResumen.getColumn(2).width = 25;
    wsResumen.getColumn(3).width = 25;
    wsResumen.getColumn(4).width = 25;
    wsResumen.getColumn(5).width = 22;


    // ==========================================
    // 2. HOJA DE OCUPACIÓN DIARIA
    // ==========================================
    const wsOcup = workbook.addWorksheet('Ocupación Diaria');
    wsOcup.views = [{ showGridLines: true }];

    wsOcup.addRow(['REPORTE DIARIO DE OCUPACIÓN']).font = { name: 'Calibri', size: 14, bold: true };
    wsOcup.addRow([`Período: ${desde} al ${hasta}`]).font = { size: 11, italic: true };
    wsOcup.addRow([]);

    const ocupHeader = wsOcup.addRow(['Fecha', 'Habitaciones Ocupadas', 'Total Habitaciones', 'Porcentaje de Ocupación']);
    ocupHeader.height = 25;
    ocupHeader.eachCell(cell => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F4E78' } };
      cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    });

    reporteCompleto.ocupacionDiaria.forEach((od: any) => {
      const row = wsOcup.addRow([
        od.fecha,
        od.habitacionesOcupadas,
        od.totalHabitaciones,
        (od.porcentaje / 100)
      ]);
      row.height = 20;
      row.getCell(4).numFmt = '0.00%';

      row.eachCell((cell, colIndex) => {
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
        cell.alignment = { vertical: 'middle' };
        if (colIndex === 1) cell.alignment = { vertical: 'middle', horizontal: 'center' };
        if (colIndex >= 2) cell.alignment = { vertical: 'middle', horizontal: 'right' };
      });
    });

    wsOcup.getColumn(1).width = 18;
    wsOcup.getColumn(2).width = 25;
    wsOcup.getColumn(3).width = 25;
    wsOcup.getColumn(4).width = 25;


    // ==========================================
    // 3. HOJA DE DISTRIBUCIÓN Y CANALES
    // ==========================================
    const wsDist = workbook.addWorksheet('Distribución y Canales');
    wsDist.views = [{ showGridLines: true }];

    wsDist.addRow(['DISTRIBUCIÓN DE INGRESOS Y CANALES DE RESERVAS']).font = { name: 'Calibri', size: 14, bold: true };
    wsDist.addRow([]);

    // Sección A-C: Distribución de ingresos por tipo
    wsDist.getCell('A3').value = 'Ingresos por Tipo de Habitación';
    wsDist.getCell('A3').font = { bold: true, size: 12, color: { argb: 'FF1F4E78' } };

    const typeHeader = wsDist.addRow(['Tipo de Habitación', 'Total Ingresos (S/)', 'Porcentaje (%)']);
    typeHeader.height = 25;
    typeHeader.eachCell((cell, colIndex) => {
      if (colIndex <= 3) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F4E78' } };
        cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
      }
    });

    reporteCompleto.ingresosPorTipo.forEach((ipt: any) => {
      const row = wsDist.addRow([
        ipt.tipoHabitacion.toUpperCase(),
        ipt.totalIngresos,
        (ipt.porcentaje / 100)
      ]);
      row.height = 20;
      row.getCell(2).numFmt = 'S/ #,##0.00';
      row.getCell(3).numFmt = '0.00%';

      row.eachCell((cell, colIndex) => {
        if (colIndex <= 3) {
          cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
          cell.alignment = { vertical: 'middle' };
          if (colIndex >= 2) cell.alignment = { vertical: 'middle', horizontal: 'right' };
        }
      });
    });

    // Sección E-G: Distribución por canales
    wsDist.getCell('E3').value = 'Reservas por Canal de Venta';
    wsDist.getCell('E3').font = { bold: true, size: 12, color: { argb: 'FF2C5E43' } };

    wsDist.getCell('E4').value = 'Canal de Venta';
    wsDist.getCell('E4').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2C5E43' } };
    wsDist.getCell('E4').font = { color: { argb: 'FFFFFFFF' }, bold: true };
    wsDist.getCell('E4').border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    wsDist.getCell('E4').alignment = { vertical: 'middle', horizontal: 'center' };

    wsDist.getCell('F4').value = 'N° Reservas';
    wsDist.getCell('F4').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2C5E43' } };
    wsDist.getCell('F4').font = { color: { argb: 'FFFFFFFF' }, bold: true };
    wsDist.getCell('F4').border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    wsDist.getCell('F4').alignment = { vertical: 'middle', horizontal: 'center' };

    wsDist.getCell('G4').value = 'Porcentaje (%)';
    wsDist.getCell('G4').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2C5E43' } };
    wsDist.getCell('G4').font = { color: { argb: 'FFFFFFFF' }, bold: true };
    wsDist.getCell('G4').border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    wsDist.getCell('G4').alignment = { vertical: 'middle', horizontal: 'center' };

    let cRowIndex = 5;
    reporteCompleto.distribucionCanales.forEach((dc: any) => {
      wsDist.getCell(`E${cRowIndex}`).value = `${dc.icono} ${dc.canal.toUpperCase()}`;
      wsDist.getCell(`F${cRowIndex}`).value = dc.cantidadReservas;
      wsDist.getCell(`G${cRowIndex}`).value = (dc.porcentaje / 100);
      wsDist.getCell(`G${cRowIndex}`).numFmt = '0.00%';

      ['E', 'F', 'G'].forEach((col, idx) => {
        const cell = wsDist.getCell(`${col}${cRowIndex}`);
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
        cell.alignment = { vertical: 'middle' };
        if (idx >= 1) cell.alignment = { vertical: 'middle', horizontal: 'right' };
      });
      cRowIndex++;
    });

    wsDist.getColumn(1).width = 25;
    wsDist.getColumn(2).width = 20;
    wsDist.getColumn(3).width = 18;
    wsDist.getColumn(4).width = 5; // Separador
    wsDist.getColumn(5).width = 25;
    wsDist.getColumn(6).width = 18;
    wsDist.getColumn(7).width = 18;


    // ==========================================
    // 4. HOJA DE CANCELACIONES Y POPULARES
    // ==========================================
    const wsCanc = workbook.addWorksheet('Cancelaciones y Populares');
    wsCanc.views = [{ showGridLines: true }];

    wsCanc.addRow(['DESGLOSE DE CANCELACIONES Y RENDIMIENTO POR HABITACIÓN']).font = { name: 'Calibri', size: 14, bold: true };
    wsCanc.addRow([]);

    // Columnas A-B: Desglose de cancelaciones
    wsCanc.getCell('A3').value = 'Motivos de Cancelación';
    wsCanc.getCell('A3').font = { bold: true, size: 12, color: { argb: 'FFC00000' } };

    const cHeader = wsCanc.addRow(['Motivo de Cancelación / Estado', 'Cantidad']);
    cHeader.height = 25;
    cHeader.eachCell((cell, colIndex) => {
      if (colIndex <= 2) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC00000' } };
        cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
      }
    });

    const mCancelaciones = reporteCompleto.cancelaciones.cancelacionesPorMotivo || {};
    const motivosKeys = Object.keys(mCancelaciones);
    
    if (motivosKeys.length === 0) {
      const emptyRow = wsCanc.addRow(['Sin cancelaciones en este período', 0]);
      emptyRow.height = 20;
      emptyRow.eachCell((cell, colIndex) => {
        if (colIndex <= 2) {
          cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
          cell.alignment = { vertical: 'middle' };
        }
      });
    } else {
      motivosKeys.forEach(key => {
        const row = wsCanc.addRow([key, mCancelaciones[key]]);
        row.height = 20;
        row.eachCell((cell, colIndex) => {
          if (colIndex <= 2) {
            cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
            cell.alignment = { vertical: 'middle' };
            if (colIndex === 2) cell.alignment = { vertical: 'middle', horizontal: 'right' };
          }
        });
      });
    }

    // Columnas D-G: Habitaciones más reservadas
    wsCanc.getCell('D3').value = 'Rendimiento - Top 10 Habitaciones Más Solicitadas';
    wsCanc.getCell('D3').font = { bold: true, size: 12, color: { argb: 'FF1F4E78' } };

    wsCanc.getCell('D4').value = 'N° Habitación';
    wsCanc.getCell('E4').value = 'Tipo Habitación';
    wsCanc.getCell('F4').value = 'Noches Reservadas';
    wsCanc.getCell('G4').value = 'Total Generado (S/)';

    ['D4', 'E4', 'F4', 'G4'].forEach(cId => {
      const cell = wsCanc.getCell(cId);
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F4E78' } };
      cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });

    let hRowIndex = 5;
    reporteCompleto.habitacionesMasReservadas.forEach((hmr: any) => {
      wsCanc.getCell(`D${hRowIndex}`).value = `Habitación ${hmr.numero}`;
      wsCanc.getCell(`E${hRowIndex}`).value = hmr.tipo.toUpperCase();
      wsCanc.getCell(`F${hRowIndex}`).value = hmr.nochesOcupadas;
      wsCanc.getCell(`G${hRowIndex}`).value = hmr.totalIngresos;
      wsCanc.getCell(`G${hRowIndex}`).numFmt = 'S/ #,##0.00';

      ['D', 'E', 'F', 'G'].forEach((col, idx) => {
        const cell = wsCanc.getCell(`${col}${hRowIndex}`);
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
        cell.alignment = { vertical: 'middle' };
        if (idx === 0) cell.alignment = { vertical: 'middle', horizontal: 'center' };
        if (idx >= 2) cell.alignment = { vertical: 'middle', horizontal: 'right' };
      });
      hRowIndex++;
    });

    wsCanc.getColumn(1).width = 35;
    wsCanc.getColumn(2).width = 12;
    wsCanc.getColumn(3).width = 5; // Separador
    wsCanc.getColumn(4).width = 18;
    wsCanc.getColumn(5).width = 20;
    wsCanc.getColumn(6).width = 18;
    wsCanc.getColumn(7).width = 22;


    // ==========================================
    // DESCARGAR ARCHIVO FINAL
    // ==========================================
    const compactDesde = desde.replace(/-/g, '');
    const compactHasta = hasta.replace(/-/g, '');
    const fileName = `REPORTE_COMPLETO_HOTEL_${compactDesde}_${compactHasta}.xlsx`;

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, fileName);
  }
}

