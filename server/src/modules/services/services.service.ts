import { AppDataSource } from "../../config/data-source";
import { Service } from "../../entities/Service";
import { Personnel } from "../../entities/Personnel";

export class ServicesService {
  private repository = AppDataSource.getRepository(Service);
  private personnelRepository = AppDataSource.getRepository(Personnel);

  async getAll() {
    return await this.repository.find({
      relations: ["personnel"],
      order: { createdAt: "DESC" }
    });
  }

  async getByPersonnelId(personnelId: string) {
    return await this.repository.find({
      where: { personnelId },
      relations: ["personnel"],
      order: { startTime: "DESC" }
    });
  }

  async create(data: Partial<Service>) {
    if (!data.personnelId) {
      throw new Error("يجب تحديد الفرد لإنشاء سجل الخدمة");
    }

    const personnel = await this.personnelRepository.findOne({
      where: { id: data.personnelId }
    });
    if (!personnel) {
      throw new Error("الفرد المحدد غير مسجل في النظام");
    }

    const record = this.repository.create(data);
    return await this.repository.save(record);
  }

  async update(id: string, data: Partial<Service>) {
    const record = await this.repository.findOne({ where: { id } });
    if (!record) {
      throw new Error("سجل الخدمة غير موجود");
    }

    this.repository.merge(record, data);
    return await this.repository.save(record);
  }

  async delete(id: string) {
    const record = await this.repository.findOne({ where: { id } });
    if (!record) {
      throw new Error("سجل الخدمة غير موجود");
    }

    await this.repository.remove(record);
    return true;
  }

  async getServicesLineup(date: string) {
    const all = await this.repository.find({
      relations: ["personnel"],
      order: { startTime: "ASC" }
    });

    const ymd = (d: Date): string =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
        d.getDate()
      ).padStart(2, "0")}`;

    const ofDay = all.filter((s) => ymd(new Date(s.serviceDay)) === date);

    const mapItem = (s: Service & { personnel?: Personnel }) => ({
      id: s.id,
      personnelId: s.personnelId,
      fullName: s.personnel?.fullName || "—",
      rank: s.personnel?.rank || "—",
      militaryId: s.personnel?.militaryId || "—",
      unit: s.personnel?.unit || "—",
      personnelType: (s.personnel?.personnelType as string) || "داخلية",
      startTime: s.startTime,
      endTime: s.endTime,
      location: s.location,
      department: s.department,
      notes: s.notes
    });

    const internal = ofDay
      .filter((s) => (s.personnel?.personnelType || "داخلية") !== "حربية")
      .map(mapItem);
    const military = ofDay
      .filter((s) => s.personnel?.personnelType === "حربية")
      .map(mapItem);

    return { date, internal, military };
  }
}

export const servicesService = new ServicesService();
