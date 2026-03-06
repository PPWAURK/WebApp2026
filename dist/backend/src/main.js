"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const swagger_1 = require("@nestjs/swagger");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const apiPrefix = (process.env.API_PREFIX ?? '').replace(/^\/+|\/+$/g, '');
    if (apiPrefix) {
        app.setGlobalPrefix(apiPrefix);
    }
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
    }));
    app.enableCors({
        origin: true,
        credentials: true,
    });
    const config = new swagger_1.DocumentBuilder()
        .setTitle('WebApp2026 API')
        .setDescription('NestJS API for mobile/web clients')
        .setVersion('1.0')
        .addBearerAuth()
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    const docsPath = apiPrefix ? `${apiPrefix}/docs` : 'docs';
    swagger_1.SwaggerModule.setup(docsPath, app, document);
    await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
//# sourceMappingURL=main.js.map