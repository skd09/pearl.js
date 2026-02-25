"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.templates = void 0;
exports.templates = {
    controller: (name, resourceful) => `import { Controller, Get${resourceful ? ', Post, Put, Delete' : ''} } from '@pearl/core';
import { Request, Response } from '@pearl/core';

@Controller('/${name.toLowerCase()}s')
export class ${name}Controller {
  @Get('/')
  async index(req: Request, res: Response): Promise<void> {
    res.json({ data: [] });
  }

  @Get('/:id')
  async show(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    res.json({ data: { id } });
  }
${resourceful ? `
  @Post('/')
  async store(req: Request, res: Response): Promise<void> {
    res.status(201).json({ data: req.body });
  }

  @Put('/:id')
  async update(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    res.json({ data: { id, ...req.body } });
  }

  @Delete('/:id')
  async destroy(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    res.status(204).json({ message: \`${name} \${id} deleted\` });
  }
` : ''}
}
`,
    model: (name, tableName) => `import { Model, Column, PrimaryKey, CreatedAt, UpdatedAt } from '@pearl/core';

@Model({ table: '${tableName}' })
export class ${name} {
  @PrimaryKey()
  id!: number;

  // TODO: define your columns
  // @Column()
  // name!: string;

  @CreatedAt()
  createdAt!: Date;

  @UpdatedAt()
  updatedAt!: Date;
}
`,
    migration: (name, tableName) => `import { Migration, Schema, Blueprint } from '@pearl/core';

export default class ${name} extends Migration {
  async up(schema: Schema): Promise<void> {
    await schema.create('${tableName}', (table: Blueprint) => {
      table.id();
      // TODO: define your columns
      // table.string('name');
      table.timestamps();
    });
  }

  async down(schema: Schema): Promise<void> {
    await schema.dropIfExists('${tableName}');
  }
}
`,
    middleware: (name) => `import { Middleware, Request, Response, NextFunction } from '@pearl/core';

@Middleware()
export class ${name}Middleware {
  async handle(req: Request, res: Response, next: NextFunction): Promise<void> {
    // TODO: implement middleware logic
    next();
  }
}
`,
    job: (name) => `import { Job } from '@pearl/core';

export interface ${name}Payload {
  // TODO: define your job payload
}

export class ${name}Job extends Job<${name}Payload> {
  static readonly queue = 'default';

  async handle(payload: ${name}Payload): Promise<void> {
    // TODO: implement job logic
    console.log('Handling ${name}Job', payload);
  }

  async failed(payload: ${name}Payload, error: Error): Promise<void> {
    console.error('${name}Job failed', error.message, payload);
  }
}
`,
    mail: (name) => `import { Mailable } from '@pearl/core';

export interface ${name}Data {
  // TODO: define mail data
  to: string;
}

export class ${name}Mail extends Mailable<${name}Data> {
  subject = '${name}';
  view = 'emails.${name.toLowerCase()}';

  async build(data: ${name}Data): Promise<this> {
    return this
      .to(data.to)
      .subject(this.subject);
  }
}
`,
    event: (name) => `import { Event } from '@pearl/core';

export interface ${name}Payload {
  // TODO: define event payload
}

export class ${name}Event extends Event<${name}Payload> {
  constructor(public readonly payload: ${name}Payload) {
    super();
  }
}
`,
    listener: (name, eventName) => `import { Listener } from '@pearl/core';
import { ${eventName}Event } from '../events/${eventName}Event';

export class ${name}Listener extends Listener<${eventName}Event> {
  async handle(event: ${eventName}Event): Promise<void> {
    // TODO: handle the ${eventName} event
    console.log('Handling ${eventName}', event.payload);
  }
}
`,
    request: (name) => `import { FormRequest } from '@pearl/core';
import { z } from 'zod';

export class ${name}Request extends FormRequest {
  schema = z.object({
    // TODO: define validation rules
    // name: z.string().min(1).max(255),
    // email: z.string().email(),
  });

  authorize(): boolean {
    return true; // TODO: add authorization logic
  }
}
`,
    resource: (name) => `import { ApiResource } from '@pearl/core';

export class ${name}Resource extends ApiResource {
  toArray(): Record<string, unknown> {
    return {
      id: this.resource.id,
      // TODO: map your resource fields
      // name: this.resource.name,
      createdAt: this.resource.createdAt,
    };
  }
}
`,
};
//# sourceMappingURL=index.js.map