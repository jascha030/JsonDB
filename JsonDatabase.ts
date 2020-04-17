const fs = (window as any).require('fs');

/**
 * JSON Database class
 *
 * Represents one JSON file used as local database
 * Uses Node.js FS to handle files
 */
export class JsonDatabase {
  private loaded = false;
  private tables: Array<any[]>;
  private readonly path: string;

  constructor(path: string) {
    this.path = this.validatePath(path);
  }

  public all<T>(table: string): Array<T> {
    this.validateTable(table);
    return this.tables[table] as Array<T>;
  }

  public find<T>(table: string, key: string, value: any): T {
    const result = this.filter<T>(table, key, value);
    return result[0] as T;
  }

  public where<T>(table: string, key: string, value: any): Array<T> {
    return this.filter<T>(table, key, value);
  }

  public insert<T>(table: string, data: T): void {
    this.validateTable(table);
    this.tables[table].push(data);
    this.save();
  }

  public updateRow<T>(table: string, where: string, is: any, key: string, val?: any): void {
    this.update<T>(table, where, is, false, val, key);
  }

  public overWriteRow<T>(table: string, where: string, is: any, data: T): void {
    this.update<T>(table, where, is, true, data);
  }

  private update<T>(table: string, where: string, is: any, overwrite = false, val: any, key?: string): void {
    if (!!this.filter<T>(table, where, is) !== true) {
      throw new Error(`No matching data was found in ${ table }`);
    }

    let count = 0;
    this.tables[table].map((row: T) => {
      if (row[where] === is) {
        count++;
        if (overwrite) {
          row = val;
        } else {
          row[key] = val;
        }
      }
      return row;
    });

    if (count > 0) {
      this.save();
    }
  }

  private filter<T>(table: string, key: string, value: any): Array<T> {
    const dataSet = this.all<T>(table);
    return dataSet.filter(data => data[key] === value);
  }

  private validateTable(table: string): void {
    this.load();
    const dataSet = this.tables[table];
    if (!!dataSet === false) {
      throw new Error(`Invalid table identifier ${ table }`);
    }
  }

  private validatePath(path: string) {
    if (!!path === false) {
      throw new Error('Filename can not be empty');
    }
    if (!fs.existsSync(path)) {
      throw new Error(`Can\'t load file: ${ path }`);
    }
    return path;
  }

  private save(): void {
    this.load();
    fs.writeFile(this.path, JSON.stringify(this.tables), (err) => {
      if (err) {
        throw err;
      }
      console.log(`Data saved to ${ this.path }`);
    });
  }

  private load(): void {
    if (this.loaded) {
      return;
    }
    try {
      const data = fs.readFileSync(this.path, 'utf8');
      this.tables = JSON.parse(data);
      console.log(this.tables);
      this.loaded = true;
    } catch (err) {
      throw new Error(`Can\'t load file: ${ this.path }, ${ err }`);
    }
  }
}
