import { MigrationInterface, QueryRunner, TableColumn, TableIndex } from 'typeorm';

export class AddChatbotConversationFields1710000000006 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('chatbot_conversations');
    if (!table) {
      throw new Error('Table chatbot_conversations does not exist');
    }

    // Add title column if it doesn't exist
    const titleColumn = table.findColumnByName('title');
    if (!titleColumn) {
      await queryRunner.addColumn(
        'chatbot_conversations',
        new TableColumn({
          name: 'title',
          type: 'varchar',
          length: '255',
          isNullable: true,
        }),
      );
    }

    // Add deviceId column if it doesn't exist
    const deviceIdColumn = table.findColumnByName('deviceId');
    if (!deviceIdColumn) {
      await queryRunner.addColumn(
        'chatbot_conversations',
        new TableColumn({
          name: 'deviceId',
          type: 'varchar',
          length: '255',
          isNullable: true,
        }),
      );
    }

    // Add sessionId column if it doesn't exist
    const sessionIdColumn = table.findColumnByName('sessionId');
    if (!sessionIdColumn) {
      await queryRunner.addColumn(
        'chatbot_conversations',
        new TableColumn({
          name: 'sessionId',
          type: 'varchar',
          length: '255',
          isNullable: true,
        }),
      );
    }

    // Create index on deviceId if it doesn't exist
    const deviceIdIndex = table.indices.find(
      (idx) => idx.name === 'IDX_chatbot_conversations_device_id',
    );
    if (!deviceIdIndex) {
      await queryRunner.createIndex(
        'chatbot_conversations',
        new TableIndex({
          name: 'IDX_chatbot_conversations_device_id',
          columnNames: ['deviceId'],
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('chatbot_conversations');
    if (!table) {
      return;
    }

    // Drop index if it exists
    const deviceIdIndex = table.indices.find(
      (idx) => idx.name === 'IDX_chatbot_conversations_device_id',
    );
    if (deviceIdIndex) {
      await queryRunner.dropIndex(
        'chatbot_conversations',
        'IDX_chatbot_conversations_device_id',
      );
    }

    // Drop columns if they exist
    if (table.findColumnByName('sessionId')) {
      await queryRunner.dropColumn('chatbot_conversations', 'sessionId');
    }
    if (table.findColumnByName('deviceId')) {
      await queryRunner.dropColumn('chatbot_conversations', 'deviceId');
    }
    if (table.findColumnByName('title')) {
      await queryRunner.dropColumn('chatbot_conversations', 'title');
    }
  }
}

