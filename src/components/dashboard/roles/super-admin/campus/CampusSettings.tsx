import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BuildingManagement } from "./building/BuildingManagement";
import { Card } from "@/components/ui/card";
import { api } from "@/utils/api";

interface CampusSettingsProps {
  campusId: string;
}

export const CampusSettings = ({ campusId }: CampusSettingsProps) => {
  const { data: campus } = api.campus.getById.useQuery(campusId);

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">
        {campus?.name ? `${campus.name} Settings` : 'Campus Settings'}
      </h1>
      
      <Card>
        <Tabs defaultValue="buildings" className="w-full">
          <TabsList className="w-full justify-start border-b">
            <TabsTrigger value="buildings">Building Settings</TabsTrigger>
            <TabsTrigger value="general">General Settings</TabsTrigger>
          </TabsList>
          
          <TabsContent value="buildings" className="p-4">
            <BuildingManagement campusId={campusId} />
          </TabsContent>
          
          <TabsContent value="general" className="p-4">
            <div>
              <h2 className="text-xl font-semibold mb-4">General Settings</h2>
              <p className="text-muted-foreground">Configure general campus settings here.</p>
            </div>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};

export default CampusSettings;
